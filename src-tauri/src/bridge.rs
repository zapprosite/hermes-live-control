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
    /// Returns `Err` with binary path and current PATH if not found.
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

        let env_path = std::env::var("PATH").unwrap_or_else(|_| "(not set)".to_string());
        Err(format!(
            "Hermes binary not found. Tried '{}'. PATH: {}",
            primary, env_path
        ))
    }

    /// Query `hermes sessions list` and return the ID of the most recently
    /// active session (the top data row after the header separator).
    pub fn get_latest_cli_session_id(&self) -> Option<String> {
        let output = Command::new(&self.bin)
            .args(&["sessions", "list"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
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
    /// Reads stdout line-by-line on a dedicated OS thread emitting `hermes://chunk` events.
    /// A second thread captures stderr concurrently to avoid pipe buffer deadlocks.
    ///
    /// On failure, the error includes: binary path, args, exit code, stderr,
    /// and (if stderr is empty) the last 1 KB of stdout.
    pub fn run(
        &self,
        app_handle: AppHandle,
        session_id: String,
        cli_session_id: Option<String>,
        text: String,
    ) -> Result<(String, Option<String>), String> {
        let is_new_session = cli_session_id.is_none();

        // Build arg list for logging and error messages
        let mut args: Vec<String> = vec!["-z".to_string(), text.clone()];
        if let Some(ref cli_id) = cli_session_id {
            args.push("-r".to_string());
            args.push(cli_id.clone());
        }

        eprintln!("[hermes-bridge] spawn: {} {:?}", self.bin, args);

        let mut cmd = Command::new(&self.bin);
        for arg in &args {
            cmd.arg(arg);
        }
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| {
            format!(
                "Failed to spawn '{}' with args {:?}: {}",
                self.bin, args, e
            )
        })?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to capture stdout".to_string())?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| "Failed to capture stderr".to_string())?;

        // Thread 1: read stdout line-by-line, emit streaming events
        let (tx_out, rx_out) = mpsc::channel::<Result<String, String>>();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            let mut response_lines: Vec<String> = Vec::new();

            for line_result in reader.lines() {
                let line = match line_result {
                    Ok(l) => l,
                    Err(e) => {
                        let _ = tx_out.send(Err(format!("IO error reading stdout: {}", e)));
                        return;
                    }
                };
                if !line.is_empty() {
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
            let _ = tx_out.send(Ok(response_lines.join("\n")));
        });

        // Thread 2: drain stderr concurrently to prevent pipe buffer deadlock
        let (tx_err, rx_err) = mpsc::channel::<String>();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            let content = reader.lines().flatten().collect::<Vec<_>>().join("\n");
            let _ = tx_err.send(content);
        });

        let response_content = rx_out
            .recv()
            .map_err(|_| "stdout reader thread dropped sender unexpectedly".to_string())??;

        let stderr_content = rx_err.recv().unwrap_or_default();

        let status = child
            .wait()
            .map_err(|e| format!("Failed to wait for Hermes CLI: {}", e))?;

        if !status.success() {
            let code_str = status
                .code()
                .map(|c| c.to_string())
                .unwrap_or_else(|| "terminated by signal".to_string());

            let detail = if !stderr_content.is_empty() {
                stderr_content.clone()
            } else if !response_content.is_empty() {
                // Include last 1 KB of stdout when stderr is empty
                let tail: String = if response_content.len() > 1024 {
                    response_content[response_content.len() - 1024..].to_string()
                } else {
                    response_content.clone()
                };
                format!("(no stderr; stdout tail) {}", tail)
            } else {
                "(no output)".to_string()
            };

            return Err(format!(
                "Hermes CLI failed (exit {}) binary='{}' args={:?} — {}",
                code_str, self.bin, args, detail
            ));
        }

        let new_cli_session_id = if is_new_session {
            self.get_latest_cli_session_id()
        } else {
            cli_session_id
        };

        Ok((response_content, new_cli_session_id))
    }
}
