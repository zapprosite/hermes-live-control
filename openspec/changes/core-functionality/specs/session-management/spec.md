## ADDED Requirements

### Requirement: Local Session Storage
The system SHALL persist session data locally in a JSON file or SQLite database.

#### Scenario: Creating a new session
- **WHEN** a new session is started
- **THEN** the backend SHALL generate a unique UUID and write a new session record to local storage

#### Scenario: Saving messages in a session
- **WHEN** a user message or assistant response is processed
- **THEN** the backend SHALL append the message to the session's message list and update the session on disk
