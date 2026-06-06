## ADDED Requirements

### Requirement: Tauri Command Router
The system SHALL register Tauri invoke commands for conversation messages, session retrieval, settings, and memory search.

#### Scenario: Frontend invokes message transmission
- **WHEN** the frontend invokes the `send_message` Tauri command with text and session ID
- **THEN** the backend SHALL route the message to the Hermes CLI interop and return the response

#### Scenario: Frontend retrieves active sessions
- **WHEN** the frontend invokes the `list_sessions` Tauri command
- **THEN** the backend SHALL return a JSON list of all stored session metadata

### Requirement: Error Serialization
The system SHALL catch Rust backend errors and serialize them into JSON error objects for the React frontend to handle.

#### Scenario: Backend command fails
- **WHEN** a Tauri command encounters a process execution or disk I/O error
- **THEN** the backend SHALL return a serialized error status with a readable message
