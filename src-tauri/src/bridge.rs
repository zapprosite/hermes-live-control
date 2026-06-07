use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Payload emitted on each stdout line from the Hermes CLI.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkPayload {
    pub session_id: String,
    pub text: String,
}

/// Owns the resolved path to the Hermes CLI binary.
pub struct HermesBridge {
    bin: String,
}

impl HermesBridge {
    /// Resolve the CLI binary path.
    /// Primary: `/home/will/.local/bin/hermes`
    /// Fallback: `which hermes`
    /// Returns `Err` with a descriptive message if not found.
    pub fn new() -> Result<Self, String> {
        let primary = "/home/will/.local/bin/hermes";
        if Path::new(primary).exists() {
            return Ok(Self { bin: primary.to_string() });
        }

        // Fallback: `which hermes`
        if let Ok(output) = Command::new("which").arg("hermes").output() {
            if output.status.success() {
                let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path_str.is_empty() {
                    return Ok(Self { bin: path_str });
                }
            }
        }

        Err(format!(
            "Hermes CLI not found at {} and not in PATH",
            primary
        ))
    }

    /// Invoke the Hermes CLI for a single conversation turn.
    ///
    /// Spawns: `hermes --pass-session-id -z <text> [--resume <cli_session_id>]`
    ///
    /// Reads stdout line-by-line on a dedicated OS thread (no tokio dep needed):
    /// - First line matching `SESSION_ID=<value>` is parsed and returned as
    ///   `new_cli_session_id`; that line is NOT included in the response content.
    /// - Every subsequent non-empty line is emitted as a `hermes://chunk` event
    ///   and accumulated into `response_content`.
    ///
    /// Returns `(response_content, new_cli_session_id)` on success, or `Err` on
    /// non-zero exit / spawn failure.
    pub fn run(
        &self,
        app_handle: AppHandle,
        session_id: String,
        cli_session_id: Option<String>,
        text: String,
    ) -> Result<(String, Option<String>), String> {
        let mut cmd = Command::new(&self.bin);
        cmd.arg("--pass-session-id").arg("-z").arg(&text);

        if let Some(ref cli_id) = cli_session_id {
            cmd.arg("--resume").arg(cli_id);
        }

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn Hermes CLI: {}", e))?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to capture stdout".to_string())?;

        // Read stdout line-by-line on a dedicated OS thread to avoid blocking
        // the async Tauri executor. Results are sent back via an mpsc channel.
        let (tx, rx) = mpsc::channel::<Result<(String, Option<String>), String>>();

        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            let mut response_lines: Vec<String> = Vec::new();
            let mut extracted_session_id: Option<String> = None;
            let mut session_id_checked = false;

            for line_result in reader.lines() {
                let line = match line_result {
                    Ok(l) => l,
                    Err(e) => {
                        let _ = tx.send(Err(format!("IO error reading stdout: {}", e)));
                        return;
                    }
                };

                // Check the first non-empty line for SESSION_ID=<value>
                if !session_id_checked {
                    if line.starts_with("SESSION_ID=") {
                        let value = line["SESSION_ID=".len()..].trim().to_string();
                        if !value.is_empty() {
                            extracted_session_id = Some(value);
                        }
                        session_id_checked = true;
                        // Do not emit this line as a chunk
                        continue;
                    } else if !line.trim().is_empty() {
                        // First non-empty line is NOT a SESSION_ID line
                        session_id_checked = true;
                    }
                }

                if !line.is_empty() {
                    // Emit event to frontend
                    let _ = app_handle.emit(
                        "hermes://chunk",
                        ChunkPayload {
                            session_id: session_id.clone(),
                            text: line.clone(),
                        },
                    );
                    response_lines.push(line);
                }
            }

            let _ = tx.send(Ok((response_lines.join("\n"), extracted_session_id)));
        });

        // Await the reader thread result
        let (response_content, new_cli_session_id) = rx
            .recv()
            .map_err(|_| "Reader thread dropped sender unexpectedly".to_string())??;

        // Await process exit and check status
        let status = child
            .wait()
            .map_err(|e| format!("Failed to wait for Hermes CLI: {}", e))?;

        if !status.success() {
            // Collect stderr for the error message
            let stderr = child
                .stderr
                .take()
                .map(|s| {
                    let mut buf = String::new();
                    BufReader::new(s).lines().flatten().for_each(|l| {
                        buf.push_str(&l);
                        buf.push('\n');
                    });
                    buf.trim().to_string()
                })
                .unwrap_or_default();

            return Err(format!(
                "Hermes CLI failed (exit {}): {}",
                status.code().unwrap_or(-1),
                if stderr.is_empty() { "no stderr output" } else { &stderr }
            ));
        }

        Ok((response_content, new_cli_session_id))
    }
}
