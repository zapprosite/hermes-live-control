## Context

The React frontend of Hermes Live Control requires connection to actual backend services via Tauri IPC commands. The current implementation uses simple React `useState` hooks with hardcoded visual stubs. This design establishes a structured, serialized Tauri IPC bridge, spawns and communicates with the Hermes CLI, provides session persistence, and creates the credential handshake for LiveKit voice streaming.

## Goals / Non-Goals

**Goals:**
- Implement Tauri commands for messages, sessions, and LiveKit token retrieval.
- Establish standard JSON request/response contracts between React (TypeScript) and Tauri (Rust).
- Persist session data to the local disk in a standard JSON format under the user's data directory.
- Spawn a child process to communicate with the Hermes CLI binary.

**Non-Goals:**
- Implementing the detailed LiveKit WebRTC client-side audio processing (handled in later voice-specific changes).
- Full implementation of a relational database system (file-based JSON storage is sufficient for MVP).

## Decisions

- **IPC Serialization:** Use `serde` for serializing and deserializing Tauri command payloads, enforcing TypeScript-compatible type structures.
- **Session Persistence:** Store sessions in a dedicated sub-directory inside the standard Tauri AppData directory (`$APP_DATA_DIR/sessions/`) as JSON files named `<session-uuid>.json`. This avoids heavy DB setup while maintaining standard file organization.
- **CLI Interop:** Use `std::process::Command` to trigger the Hermes CLI binary. If the binary is missing, gracefully fall back to a mock mode and log a diagnostic warning instead of crashing.

## Risks / Trade-offs

- **CLI Blocking I/O:** Spawning processes in a blocking manner could block the main thread.
  - *Mitigation:* We will run CLI commands asynchronously or spawn them inside a tokio runtime task to prevent blocking the Tauri main loop.
- **Disk Write Failure:** AppData directory might have permission issues.
  - *Mitigation:* The backend will automatically check for and create the directory on startup and return serialized error models if write commands fail.
