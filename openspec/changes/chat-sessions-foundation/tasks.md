## 1. Rust — Complete Session CRUD Commands

- [x] 1.1 Add `rename_session(session_id: String, title: String)` Tauri command to `lib.rs` — updates `title` and `updated_at`, writes JSON file, returns updated `Session`
- [x] 1.2 Add `delete_session(session_id: String)` Tauri command to `lib.rs` — removes `<id>.json` from disk, returns `Ok`
- [x] 1.3 Add auto-title logic inside `send_message`: if `session.title == "New Chat"` and `session.messages.is_empty()`, truncate user text to 40 chars at a word boundary and set as title before persisting

## 2. Frontend — SessionSidebar Component

- [x] 2.1 Create `src/components/SessionSidebar.tsx` — accepts props `{ sessions, activeSessionId, isOpen, onClose, onSelect, onCreate, onRename, onDelete }`, renders the drawer with session list, New Chat button, inline rename on double-click (Enter/Escape/blur), hover-reveal trash icon, and empty state
- [x] 2.2 Replace the inline sidebar JSX in `App.tsx` with `<SessionSidebar />`, wiring `invoke("rename_session")` and `invoke("delete_session")` callbacks; ensure active session falls back to the next session (or empty state) after deletion

## 3. Build Validation

- [x] 3.1 Run `npm run build` (frontend) and `cargo build` (Tauri) — resolve any TypeScript or Rust compile errors introduced by tasks 1 and 2
