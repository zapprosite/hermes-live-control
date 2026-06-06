## Why

Hermes Live Control needs a robust backend foundation to support its React frontend. This change introduces the core Rust-based Tauri commands, local session management, and interop layer with the Hermes CLI and LiveKit backend, unlocking functional data flows and real-time voice capability.

## What Changes

- Implement Tauri Rust IPC command handlers for message exchange, session loading, settings retrieval, and memory search.
- Integrate the Rust backend with the Hermes CLI binary using process spawning.
- Set up local state management in the Tauri backend for session persistence and retrieval.
- Add LiveKit connection credential helpers and state synchronization.

## Capabilities

### New Capabilities
- `tauri-ipc-interop`: Setup of Tauri command handlers and serialization schemas for frontend-backend communication.
- `hermes-cli-integration`: Process spawning, input/output piping, and response parsing for interacting with the Hermes CLI.
- `session-management`: Local persistence, retrieval, and history management for conversations.
- `livekit-voice-bridge`: Helper commands for managing LiveKit credentials, connection tokens, and WebRTC states.

### Modified Capabilities

## Impact

- `src-tauri/src/main.rs`: Registration of new Tauri commands and state management.
- `src-tauri/Cargo.toml`: Adding dependencies like `serde`, `serde_json`, and any utilities for process orchestration.
- `src/App.tsx` and frontend components: Integration with Tauri IPC invoke calls instead of static mock state.
