## Why

Hermes Live Control currently has no conversation memory — every restart loses context and there is no way to revisit past exchanges. Users need persistent, named chat sessions so Hermes behaves like a real assistant rather than a stateless chatbot.

## What Changes

- Introduce a `Session` data model (id, title, createdAt, updatedAt, messages[]).
- Introduce a `Message` data model (id, role, content, timestamp).
- Add a Tauri v2 Rust command layer for CRUD operations on sessions stored as JSON files in the app's local data directory.
- Add a React + TypeScript `SessionStorage` service that calls the Tauri commands.
- Add a `SessionSidebar` component listing all sessions with New Chat, rename, and delete actions.
- Wire session selection to the existing chat view so the correct message history is loaded and appended.

## Capabilities

### New Capabilities

- `session-storage`: Local filesystem persistence of sessions and their messages via Tauri commands. Covers create, read, update, delete, and list operations with atomic JSON file writes.
- `session-sidebar`: React sidebar UI that lists sessions, supports New Chat, rename (inline), delete, and active session highlighting.

### Modified Capabilities

*(none — no existing specs exist)*

## Impact

- **Frontend**: New `SessionSidebar` component; chat view must accept an active session and persist new messages to it.
- **Tauri (Rust)**: Three new commands: `list_sessions`, `save_session`, `delete_session`. Session files written to `$APPDATA/hermes/sessions/<id>.json`.
- **Dependencies**: No new npm or Cargo dependencies required (Tauri `fs` plugin already available via `tauri-plugin-fs`).
- **State management**: Lightweight React `useState` / `useEffect` — no Redux or Zustand needed at this scale.
