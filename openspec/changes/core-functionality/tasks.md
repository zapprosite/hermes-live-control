## 1. Rust Backend IPC and Models

- [x] 1.1 Add dependencies to `src-tauri/Cargo.toml`
- [x] 1.2 Define data structures for `Message`, `Session`, and `LiveKitCredentials` in Rust
- [x] 1.3 Implement local file-based persistence for `Session` in Tauri AppData directory
- [x] 1.4 Implement Tauri command handlers for `send_message`, `list_sessions`, `create_session`, and `get_livekit_token` in `src-tauri/src/lib.rs`

## 2. Hermes CLI Integration

- [x] 2.1 Implement child process execution to spawn Hermes CLI binary
- [x] 2.2 Add fallback mock execution mechanism in case CLI binary is not present in environment

## 3. Frontend Integration

- [x] 3.1 Bind React UI composer to invoke Tauri `send_message` and display conversation messages
- [x] 3.2 Bind React UI session list/chips to invoke Tauri `list_sessions` and `create_session`
- [x] 3.3 Bind React UI "Live Voice" button to invoke `get_livekit_token` and update Live Voice UI state
