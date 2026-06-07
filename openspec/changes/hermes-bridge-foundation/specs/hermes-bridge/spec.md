## ADDED Requirements

### Requirement: HermesBridge module encapsulates CLI invocation
The system SHALL implement a `HermesBridge` struct in `src-tauri/src/bridge.rs` that is the single owner of all Hermes CLI invocation logic.

#### Scenario: Bridge resolves CLI path on construction
- **WHEN** `HermesBridge::new()` is called
- **THEN** it SHALL check `/home/will/.local/bin/hermes` first, then `$PATH` via `which hermes`, and return `Ok(HermesBridge)` if found or `Err(String)` with a descriptive message if not

#### Scenario: Bridge returns error when CLI not found
- **WHEN** neither the primary path nor `$PATH` contains the hermes binary
- **THEN** `HermesBridge::new()` SHALL return `Err("Hermes CLI not found …")` and the `send_message` command SHALL propagate this error to the frontend

### Requirement: Session ID captured via --pass-session-id
The bridge SHALL pass `--pass-session-id` on every CLI invocation so the session ID can be read from the first stdout line without querying `sessions list`.

#### Scenario: Session ID extracted from first stdout line
- **WHEN** the CLI outputs a line matching `SESSION_ID=<value>` as the first non-empty stdout line
- **THEN** the bridge SHALL parse `<value>` and return it alongside the response content

#### Scenario: Missing SESSION_ID line handled gracefully
- **WHEN** no `SESSION_ID=` line appears in stdout
- **THEN** the bridge SHALL proceed without a session ID rather than returning an error

### Requirement: Existing CLI session resumed via --resume flag
When a session already has a `cli_session_id` from a previous turn, the bridge SHALL pass `--resume <cli_session_id>` so the Hermes CLI continues the same conversation thread.

#### Scenario: Resume flag added when session ID exists
- **WHEN** `session.cli_session_id` is `Some(id)`
- **THEN** the CLI invocation SHALL include `--resume <id>` and SHALL NOT create a new CLI session

#### Scenario: No resume flag on first message
- **WHEN** `session.cli_session_id` is `None`
- **THEN** the CLI invocation SHALL omit `--resume` and SHALL create a new CLI session

### Requirement: Non-zero CLI exit is a typed error
The bridge SHALL treat a non-zero CLI exit code as a hard error and return it to the caller with the stderr payload.

#### Scenario: Stderr surfaced on failure
- **WHEN** the CLI exits with a non-zero exit code
- **THEN** the `send_message` Tauri command SHALL return `Err("Hermes CLI failed: <stderr>")` and no assistant message SHALL be appended to the session

### Requirement: Session JSON updated atomically after response
After a successful CLI invocation, the session file SHALL be updated with the new `cli_session_id` (if newly captured) and the assistant message appended, in a single `save_session` call.

#### Scenario: Single file write per send_message
- **WHEN** `send_message` completes successfully
- **THEN** exactly one write to the session JSON file SHALL occur after both user and assistant messages are appended
