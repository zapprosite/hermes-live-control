## ADDED Requirements

### Requirement: LiveKit Token Generation
The system SHALL provide access tokens for the frontend to connect to the LiveKit Server.

#### Scenario: Requesting voice room credentials
- **WHEN** the frontend requests room join credentials for a voice session
- **THEN** the backend SHALL return the LiveKit Server URL and a newly generated JWT access token
