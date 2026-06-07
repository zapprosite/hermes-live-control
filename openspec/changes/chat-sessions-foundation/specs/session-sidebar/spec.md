## ADDED Requirements

### Requirement: Session list rendered in sidebar
The `SessionSidebar` component SHALL render a scrollable list of all sessions, one entry per session, showing the session title and a relative or absolute timestamp.

#### Scenario: Sessions displayed in recency order
- **WHEN** the sidebar is open and sessions exist
- **THEN** sessions SHALL be listed from most recently updated (top) to least recently updated (bottom)

#### Scenario: Empty state displayed when no sessions exist
- **WHEN** no sessions exist
- **THEN** the sidebar SHALL display a non-error empty-state message (e.g., "No sessions yet")

### Requirement: Active session highlighted
The sidebar SHALL visually distinguish the currently selected session from all others.

#### Scenario: Active session has distinct style
- **WHEN** a session is the active session
- **THEN** its sidebar entry SHALL render with the accent-color background and border, and all other entries SHALL render in the default (unfocused) style

### Requirement: New Chat button
The sidebar SHALL contain a "New Chat" button that creates a new session and selects it.

#### Scenario: New Chat creates and selects session
- **WHEN** the user clicks "New Chat"
- **THEN** the system SHALL invoke `create_session`, close the sidebar drawer, and render the new empty chat view

### Requirement: Session rename via inline edit
The user SHALL be able to rename a session by double-clicking its title in the sidebar.

#### Scenario: Title becomes editable on double-click
- **WHEN** the user double-clicks a session title in the sidebar
- **THEN** the title text SHALL be replaced with a focused text input pre-filled with the current title

#### Scenario: Rename committed on Enter or blur
- **WHEN** the user presses Enter or clicks outside the rename input
- **THEN** the system SHALL invoke `rename_session` with the new title (if non-empty and changed), update the sidebar entry, and exit edit mode

#### Scenario: Rename cancelled on Escape
- **WHEN** the user presses Escape during rename
- **THEN** the title SHALL revert to the original value and edit mode SHALL exit without saving

### Requirement: Session delete with undo window
The user SHALL be able to delete a session from the sidebar with a brief confirmation window.

#### Scenario: Trash icon appears on hover
- **WHEN** the user hovers over a session entry
- **THEN** a trash/delete icon SHALL become visible on the right side of the entry

#### Scenario: Delete invoked after confirmation
- **WHEN** the user clicks the trash icon
- **THEN** the session SHALL be removed from the list immediately, and the system SHALL invoke `delete_session`; if the deleted session was active, the system SHALL select the next available session or show the empty state

### Requirement: Sidebar opens and closes via menu button
The sidebar SHALL be toggled by a hamburger/menu button in the app header.

#### Scenario: Sidebar opens on menu click
- **WHEN** the user clicks the menu button in the header
- **THEN** the sidebar drawer SHALL slide in from the left with a smooth CSS transition

#### Scenario: Sidebar closes on overlay click
- **WHEN** the sidebar is open and the user clicks the background overlay
- **THEN** the sidebar SHALL close

### Requirement: Sidebar is an isolated React component
The sidebar UI SHALL be implemented as `src/components/SessionSidebar.tsx` accepting props: `sessions`, `activeSessionId`, `onSelect`, `onCreate`, `onRename`, `onDelete`.

#### Scenario: Sidebar renders with provided props
- **WHEN** `SessionSidebar` is rendered with a non-empty sessions array and an `activeSessionId`
- **THEN** it SHALL display session entries and highlight the active one without internal data fetching
