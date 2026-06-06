## ADDED Requirements

### Requirement: Hermes CLI Spawning
The system SHALL spawn the Hermes CLI binary as a child process to send commands and receive output.

#### Scenario: Running a text prompt via CLI
- **WHEN** the backend invokes the Hermes CLI process with a user prompt argument
- **THEN** it SHALL wait for the process to exit and return stdout as the text response

### Requirement: CLI Diagnostics
The system SHALL check for the presence of the Hermes CLI binary on startup and report failures.

#### Scenario: CLI binary not found
- **WHEN** the application starts up and cannot find the Hermes CLI executable
- **THEN** the backend SHALL log a critical error and fail gracefully on commands requiring the CLI
