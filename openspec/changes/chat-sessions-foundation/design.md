## Context

Hermes Live Control is a Tauri v2 desktop app with a React + TypeScript frontend. The Rust backend (`src-tauri/src/lib.rs`) already defines `Session` and `Message` structs and implements `list_sessions`, `get_session`, `create_session`, and `send_message` Tauri commands. The frontend (`src/App.tsx`) calls these commands and renders a slide-out sidebar.

The current state is a working skeleton: sessions can be created, listed, and selected. Missing pieces are: rename, delete, auto-titling from the first user message, and a well-isolated `SessionSidebar` component. No external state library, no complex routing.

## Goals / Non-Goals

**Goals:**
- Complete the CRUD surface: add `rename_session` and `delete_session` Tauri commands.
- Auto-generate session titles from the first user message (truncated, server-side).
- Extract the sidebar into a reusable `SessionSidebar` component.
- All session state persists across app restarts via JSON files in the OS app-data directory.

**Non-Goals:**
- Vector memory, embeddings, or semantic search.
- LiveKit, voice pipeline, or any streaming feature.
- Remote sync or cloud storage.
- Agents, skills, observability, or dashboards.
- Complex session management UI (no tables, no bulk operations).

## Decisions

### D1 — JSON files on the local filesystem (not SQLite)
**Decision**: Each session is stored as a single `<id>.json` file in `$APPDATA/hermes/sessions/`.
**Rationale**: Zero additional Cargo dependencies. Sessions are small (text only). File-per-session avoids schema migrations. Tauri's `app_data_dir()` is cross-platform.
**Alternative considered**: SQLite via `rusqlite`. Rejected — overkill for a personal chat app with < 1 000 sessions; adds 2 MB to binary.

### D2 — Auto-title from first user message
**Decision**: When a session still has the default title ("New Chat") and a user message is sent, the Rust `send_message` handler truncates the user text to 40 characters and renames the session.
**Rationale**: Mirrors ChatGPT UX without a round-trip LLM call. Simple and immediate.
**Alternative considered**: Call an LLM to generate a title. Rejected — adds latency, costs tokens, outside scope.

### D3 — Inline rename via double-click
**Decision**: Double-clicking a session name in the sidebar makes it editable in-place (`contenteditable` or controlled `<input>`). Pressing Enter or blurring saves it.
**Rationale**: No additional modal or dialog needed. Feels native and ChatGPT-like.

### D4 — Delete with confirmation tooltip (not a modal)
**Decision**: A trash icon appears on hover; a single click triggers deletion after a brief 300 ms undo window shown inline.
**Rationale**: Avoids heavyweight modal dialogs. Keeps the sidebar clean.

### D5 — Session sidebar as a standalone component
**Decision**: Extract sidebar JSX into `src/components/SessionSidebar.tsx`. `App.tsx` passes session list, active session ID, and callbacks as props.
**Rationale**: Separation of concerns; makes the sidebar independently testable and keeps `App.tsx` under 200 lines.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| JSON file corruption on crash mid-write | Use `write_all` (atomic on Linux via tmpfile rename pattern — future hardening) |
| Session list grows large and slow to load | Acceptable at personal-use scale; paginate in a future change |
| Auto-title truncation cuts mid-word | Truncate at word boundary up to 40 chars |
