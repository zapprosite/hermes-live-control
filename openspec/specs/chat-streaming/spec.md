# chat-streaming Specification

## Purpose
TBD - created by archiving change hermes-bridge-foundation. Update Purpose after archive.
## Requirements
### Requirement: Streaming assistant bubble renders incrementally
The frontend SHALL display a streaming assistant message bubble immediately after the user sends a message, updating its content as `hermes://chunk` events arrive.

#### Scenario: Streaming bubble appears before response completes
- **WHEN** the user submits a message and `send_message` is invoked
- **THEN** an assistant bubble SHALL appear in the message list with a pulsing/loading indicator before any chunk arrives

#### Scenario: Chunk events append to streaming bubble
- **WHEN** a `hermes://chunk` Tauri event is received with payload `{ sessionId, text }`
- **THEN** the streaming bubble's content SHALL be updated by appending `text` to the existing content, with no full re-render of the message list

#### Scenario: Streaming bubble finalized on command resolve
- **WHEN** `send_message` resolves successfully with the completed `Message` object
- **THEN** the streaming bubble SHALL be replaced by the final message, the event listener SHALL be torn down, and the loading state SHALL clear

### Requirement: Chunks are scoped to the active session
The frontend SHALL ignore `hermes://chunk` events whose `sessionId` does not match the currently active session.

#### Scenario: Stale chunks ignored after session switch
- **WHEN** the user switches sessions while a response is streaming
- **THEN** chunks from the previous session SHALL NOT appear in the newly selected session's message list

### Requirement: Streaming failure renders inline error
If `send_message` rejects, the streaming bubble SHALL be replaced with an error message bubble styled distinctly (e.g., red border), showing the error text.

#### Scenario: CLI error displayed inline
- **WHEN** `send_message` rejects with an error string
- **THEN** an error bubble SHALL replace the loading bubble with content derived from the error string, and the input SHALL re-enable

### Requirement: Loading state disables input during streaming
While a response is in-flight, the message input and send button SHALL be disabled to prevent concurrent submissions.

#### Scenario: Input disabled during streaming
- **WHEN** streaming is in progress (`isLoading === true`)
- **THEN** the textarea and send button SHALL be visually disabled and non-interactive

#### Scenario: Input re-enabled after completion or error
- **WHEN** `send_message` resolves or rejects
- **THEN** `isLoading` SHALL be set to `false` and the input SHALL accept new messages

### Requirement: Tauri event listener lifecycle is managed correctly
The frontend SHALL register the `hermes://chunk` event listener before invoking `send_message` and remove it after the command settles.

#### Scenario: No dangling listeners
- **WHEN** `send_message` completes (success or error)
- **THEN** the `hermes://chunk` event listener set up for that request SHALL be unregistered

