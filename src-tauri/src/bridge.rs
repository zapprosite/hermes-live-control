use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::sync::mpsc;
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
    pub bin: String,
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

    /// Query `hermes sessions list` and return the ID of the most recently
    /// active session (the top data row after the header separator).
    ///
    /// Output format (verified against live CLI):
    /// ```
    /// Title   Preview   Last Active   ID
    /// ─────────────────────────────────────
    /// —       hello     just now      20260606_221422_28a094
    /// ```
    /// The ID is always the last whitespace-separated token on the first data row.
    pub fn get_latest_cli_session_id(&self) -> Option<String> {
        let output = Command::new(&self.bin)
            .args(&["sessions", "list"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        // Skip header (line 0) and separator (line 1); first data row is line 2.
        let lines: Vec<&str> = stdout.lines().collect();
        if lines.len() > 2 {
            let first_data_line = lines[2];
            if let Some(id) = first_data_line.split_whitespace().last() {
                return Some(id.to_string());
            }
        }
        None
    }

    /// Invoke the Hermes CLI for a single conversation turn.
    ///
    /// Spawns: `hermes -z <text> [-r <cli_session_id>]`
    ///
    /// Reads stdout line-by-line on a dedicated OS thread:
    /// - Every non-empty line is emitted as a `hermes://chunk` Tauri event
    ///   and accumulated into `response_content`.
    ///
    /// Session ID capture:
    /// - If `cli_session_id` is already `Some`, the same ID is returned unchanged.
    /// - If `None` (first turn), queries `sessions list` after the process exits
    ///   to get the newly created session ID.
    ///
    /// Returns `(response_content, new_cli_session_id)` on success,
    /// or `Err` on non-zero exit / spawn failure.
    pub fn run(
        &self,
        app_handle: AppHandle,
        session_id: String,
        cli_session_id: Option<String>,
        text: String,
    ) -> Result<(String, Option<String>), String> {
        let is_new_session = cli_session_id.is_none();

        let mut cmd = Command::new(&self.bin);
        cmd.arg("-z").arg(&text);

        if let Some(ref cli_id) = cli_session_id {
            cmd.arg("-r").arg(cli_id);
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

        // Read stdout on a dedicated OS thread (avoids blocking the async Tauri executor).
        let (tx, rx) = mpsc::channel::<Result<(String,), String>>();

        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            let mut response_lines: Vec<String> = Vec::new();

            for line_result in reader.lines() {
                let line = match line_result {
                    Ok(l) => l,
                    Err(e) => {
                        let _ = tx.send(Err(format!("IO error reading stdout: {}", e)));
                        return;
                    }
                };

                if !line.is_empty() {
                    // Emit streaming event to frontend
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

            let _ = tx.send(Ok((response_lines.join("\n"),)));
        });

        // Await the reader thread
        let (response_content,) = rx
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

        // For the first turn of a session, capture the new CLI session ID via
        // `sessions list`. The race window is minimal: we wait until process exit
        // before querying, so the session file is already flushed by the CLI.
        let new_cli_session_id = if is_new_session {
            self.get_latest_cli_session_id()
        } else {
            cli_session_id
        };

        Ok((response_content, new_cli_session_id))
    }
}
