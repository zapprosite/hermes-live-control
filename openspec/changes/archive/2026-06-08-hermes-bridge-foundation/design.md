## Context

The current `send_message` Tauri command in `lib.rs` calls `Command::output()` which blocks the Rust thread until the entire CLI process exits. For Hermes responses that involve tool-calling or multi-step reasoning this can take 10–30 seconds with no feedback in the UI. Additionally, the CLI session ID is captured by a fragile post-hoc `sessions list` parse that races against the filesystem.

The Hermes CLI already supports `--pass-session-id` which causes it to print `SESSION_ID=<uuid>` as the first line of stdout before any response tokens. This is the canonical way to capture the session ID.

## Goals / Non-Goals

**Goals:**
- Isolate all CLI invocation into `src-tauri/src/bridge.rs` so `lib.rs` stays thin.
- Stream stdout tokens to the frontend via Tauri events (`hermes://chunk`) as the process produces them.
- Use `--pass-session-id` for reliable, race-free session ID capture from the first stdout line.
- Surface CLI failures (non-zero exit, missing binary) as explicit, human-readable errors.
- Keep total implementation within 3 tasks.

**Non-Goals:**
- True async streaming at the Tauri layer (events are sufficient; no WebSocket or SSE).
- Cancelling an in-flight request (future change).
- Parsing or interpreting Hermes tool-call output.
- Reconnecting to a crashed CLI process.

## Decisions

### D1 — Dedicated `bridge.rs` module
**Decision**: Extract all CLI logic into `src-tauri/src/bridge.rs` with a `HermesBridge` struct holding the resolved binary path and a `run` method.
**Rationale**: Keeps `lib.rs` focused on Tauri command wiring. The bridge is unit-testable in isolation. Future extensions (timeouts, cancellation) stay in one place.
**Alternative**: Keep everything in `lib.rs`. Rejected — already 278 lines and growing.

### D2 — `BufReader` line-by-line streaming over a spawned child process
**Decision**: Use `std::process::Command::spawn()` + `BufReader<ChildStdout>` to read lines incrementally. Each non-empty line is emitted as a `hermes://chunk` event via `app_handle.emit()`. The process is awaited after the read loop ends.
**Rationale**: No new Cargo dependencies. `emit` is fire-and-forget and crosses the Rust→WebView boundary in <1 ms. Line-based chunking is natural for LLM token output which already arrives in newline-delimited bursts.
**Alternative considered**: Use `tokio::process` + async channels. Rejected — adds complexity without user-visible benefit at this scale; Tauri's `async fn` commands already run on the tokio runtime so blocking within `spawn_blocking` is the cleaner pattern.

### D3 — `--pass-session-id` for session ID extraction
**Decision**: Always pass `--pass-session-id` to the CLI. The first stdout line matching `SESSION_ID=<value>` is parsed and stored on the session; subsequent lines are the response.
**Rationale**: Eliminates the racy `sessions list` scrape. The flag is documented and stable.

### D4 — Frontend streaming bubble
**Decision**: When `send_message` is invoked, the frontend immediately renders a "streaming" assistant bubble with empty content. Each `hermes://chunk` event appends to the bubble's content. When `send_message` resolves, the final `Message` object replaces the streaming bubble.
**Rationale**: Mimics ChatGPT's progressive rendering. The event listener is set up before the invoke call and torn down on completion.

### D5 — Explicit error on missing CLI
**Decision**: Remove the mock fallback. `HermesBridge::new()` returns `Err("Hermes CLI not found at /home/will/.local/bin/hermes and not in PATH")` immediately.
**Rationale**: Silent mocks hide real failures. Users should know immediately if the CLI is missing.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Long-running Hermes calls block the Tauri async thread | Move the blocking `BufReader` read loop into `tokio::task::spawn_blocking` |
| `SESSION_ID=` line format changes in a future CLI version | Parse defensively; if line not found, continue without setting `cli_session_id` |
| Rapid chunk events saturate the WebView event queue | Batch lines into 50 ms windows in a future change; acceptable at MVP |
