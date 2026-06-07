## ADDED Requirements

### Requirement: Session CRUD via Tauri commands
The system SHALL expose four Tauri commands — `list_sessions`, `get_session`, `create_session`, `rename_session`, and `delete_session` — that the frontend invokes to manage session lifecycle.

#### Scenario: List sessions sorted by most recently updated
- **WHEN** `list_sessions` is invoked
- **THEN** the system SHALL return an array of sessions sorted descending by `updated_at`, with `messages` omitted for performance

#### Scenario: Create a new session
- **WHEN** `create_session` is invoked with an optional title string
- **THEN** the system SHALL generate a UUID for `id`, set `created_at` and `updated_at` to current Unix timestamp (ms), store the session as `<id>.json` in the app data sessions directory, and return the full session object

#### Scenario: Retrieve a session with its messages
- **WHEN** `get_session` is invoked with a valid session ID
- **THEN** the system SHALL read the corresponding JSON file and return the full `Session` object including the `messages` array

#### Scenario: Rename a session
- **WHEN** `rename_session` is invoked with a session ID and a non-empty title string
- **THEN** the system SHALL update the session's `title` and `updated_at` fields, persist the change to disk, and return the updated session

#### Scenario: Delete a session
- **WHEN** `delete_session` is invoked with a session ID
- **THEN** the system SHALL remove the corresponding JSON file from disk and return `Ok`

### Requirement: Session JSON file format
Each session SHALL be persisted as a pretty-printed JSON file at `$APP_DATA_DIR/sessions/<id>.json` conforming to the `Session` schema.

#### Scenario: Session file written on create
- **WHEN** a session is created
- **THEN** a valid JSON file with keys `id`, `title`, `created_at`, `updated_at`, `messages` SHALL exist at the expected path immediately after the command returns

#### Scenario: Session file removed on delete
- **WHEN** `delete_session` succeeds
- **THEN** no file at `$APP_DATA_DIR/sessions/<id>.json` SHALL remain

### Requirement: Auto-title from first user message
The system SHALL automatically rename a session whose title is "New Chat" when the first user message is appended via `send_message`.

#### Scenario: Auto-title applied on first message
- **WHEN** `send_message` is called on a session with title "New Chat" and the session has no prior messages
- **THEN** the system SHALL set the session title to the first 40 characters of the user message, truncated at a word boundary, and persist the change

#### Scenario: Auto-title skipped for subsequent messages
- **WHEN** `send_message` is called on a session that already has at least one message
- **THEN** the session title SHALL NOT be modified

### Requirement: Message appended to session on send
When `send_message` is invoked the system SHALL append both the user message and the assistant reply to the session's `messages` array and persist the full session.

#### Scenario: Messages persisted after send
- **WHEN** `send_message` returns successfully
- **THEN** the session file SHALL contain the new user message and assistant message in the `messages` array

### Requirement: Frontend SessionStorage service
The frontend SHALL expose a `sessionStorage` TypeScript module that wraps all Tauri command invocations with typed models.

#### Scenario: Typed session list returned
- **WHEN** `sessionStorage.listSessions()` is called
- **THEN** it SHALL return `Promise<Session[]>` where `Session` matches the agreed schema

#### Scenario: Error propagated on Tauri failure
- **WHEN** an underlying Tauri command rejects
- **THEN** the `sessionStorage` function SHALL re-throw the error so the caller can handle it
