## Why

Hermes Live Control has a working UI, persistent sessions, and a functional message pipeline — but the Rust `send_message` command spawns the CLI in a blocking, fire-and-forget way with no streaming, unreliable session ID capture, and a mock fallback that silently hides broken integrations. Real conversations are blocked until the entire CLI response returns, which can take 10–30 seconds for complex queries. The bridge layer needs to be made production-grade.

## What Changes

- **Replace** the ad-hoc `Command::output()` call in `send_message` with a dedicated `HermesBridge` module (`src-tauri/src/bridge.rs`) that owns all CLI invocation logic.
- **Add streaming** via Tauri events: the bridge reads stdout line-by-line and emits `hermes://chunk` events to the frontend as tokens arrive; `send_message` returns the completed `Message` only when the process exits.
- **Fix session ID capture**: use `--pass-session-id` flag so the CLI prints its session ID on the first stdout line in a parseable format, eliminating the fragile `sessions list` scrape.
- **Harden error paths**: non-zero exit codes and stderr payloads surface as typed error strings to the frontend; the UI shows an inline error bubble rather than swallowing failures silently.
- **Remove mock fallback** that hides broken CLI installations; instead surface a clear "Hermes CLI not found" error with the expected path.

## Capabilities

### New Capabilities

- `hermes-bridge`: Rust module encapsulating all Hermes CLI invocation — path detection, argument construction, process spawning, stdout streaming, session ID extraction, and error handling.
- `chat-streaming`: Frontend capability to consume incremental `hermes://chunk` Tauri events and render tokens as they arrive, replacing the single-shot response pattern.

### Modified Capabilities

*(none — no existing specs change at the requirement level)*

## Impact

- **Rust**: New `src-tauri/src/bridge.rs`; `lib.rs` `send_message` refactored to delegate to `HermesBridge`.
- **Frontend** (`App.tsx`): Listen for `hermes://chunk` events using `@tauri-apps/api/event`; accumulate chunks into a streaming bubble; finalize on `send_message` resolve.
- **Dependencies**: No new Cargo crates required (tokio already available via Tauri; `std::process::Command` + `BufReader` covers line-by-line stdout).
- **Breaking change**: The mock fallback path is removed. Environments without `hermes` CLI will now receive an explicit error.
