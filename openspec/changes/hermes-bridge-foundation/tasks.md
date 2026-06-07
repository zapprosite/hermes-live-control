## 1. Rust — HermesBridge Module

- [x] 1.1 Create `src-tauri/src/bridge.rs` with a `HermesBridge` struct: `new()` resolves the CLI binary path (primary `/home/will/.local/bin/hermes`, fallback `which hermes`) returning `Err` if not found; `run(app_handle, session_id, cli_session_id, text)` spawns the process with `--pass-session-id -z <text> [--resume <cli_id>]`, reads stdout line-by-line via `BufReader` inside `spawn_blocking`, emits each non-empty line as a `hermes://chunk` event (`{ sessionId, text }`), parses `SESSION_ID=<value>` from the first line, awaits process exit, returns `(response_content: String, new_cli_session_id: Option<String>)` or `Err` on non-zero exit
- [x] 1.2 Refactor `send_message` in `lib.rs` to delegate to `HermesBridge::new()?.run(...)`: append user message and set auto-title before the CLI call; on success append assistant message and update `cli_session_id` in a single `save_session` call; on error return `Err` without writing the assistant message; declare `bridge` as a module in `lib.rs` (`mod bridge;`)

## 2. Frontend — Streaming Chat UI

- [x] 2.1 Update `handleSendMessage` in `App.tsx`: before calling `invoke("send_message")`, register a `listen("hermes://chunk")` handler that checks `payload.sessionId === currentSession.id` and appends `payload.text` to a `streamingContent` state string; render this as a live assistant bubble with a blinking cursor when `isLoading && streamingContent`; on `send_message` resolve replace the streaming state with the final `Message` from the command; on reject show an error bubble; always unlisten in a `finally` block

## 3. Build Validation

- [x] 3.1 Run `cargo build` in `src-tauri/` and `npm run build` at repo root — resolve any compile errors; verify the app starts with `npm run tauri dev` and a real message round-trip reaches the Hermes CLI and streams tokens into the UI
