## ADDED Requirements

### Requirement: Chat message exchange
The system SHALL connect to an opencode serve instance via WebSocket and send/receive chat messages.

#### Scenario: User sends a message
- **WHEN** user types a message and presses Enter
- **THEN** message appears in chat history and is sent to the active opencode session via WebSocket

#### Scenario: AI response streams in
- **WHEN** opencode responds with streaming text
- **THEN** response appears incrementally in the chat panel with a typing indicator

#### Scenario: Tool execution display
- **WHEN** opencode invokes a tool during a session
- **THEN** the tool name and arguments are displayed as a collapsible card in the chat stream

#### Scenario: Tool result display
- **WHEN** a tool execution completes
- **THEN** the result is shown beneath the tool call card, truncated if over 500 lines with an expand option

### Requirement: Session management
The system SHALL allow users to manage multiple opencode sessions.

#### Scenario: Start new session
- **WHEN** user creates a new report or clicks "New Session"
- **THEN** a fresh opencode session is created and becomes the active session

#### Scenario: Switch between sessions
- **WHEN** user clicks a session in the session list
- **THEN** chat panel loads that session's message history

#### Scenario: Resume disconnected session
- **WHEN** UI reconnects to opencode serve after a disconnect
- **THEN** active sessions are restored with their message history

### Requirement: Message input with file context
The system SHALL support attaching file references and context to chat messages.

#### Scenario: Attach file to message
- **WHEN** user drags a file into the chat input area
- **THEN** the file path is attached to the message as context

#### Scenario: Send selected HTML content
- **WHEN** user has elements selected in the report preview and clicks "Send to AI"
- **THEN** selected HTML source is inserted into the chat input as quoted context

### Requirement: Chat toolbar
The system SHALL provide a toolbar with common actions above the chat input.

#### Scenario: Clear conversation
- **WHEN** user clicks "Clear" in the chat toolbar
- **THEN** the current session's visible messages are cleared (but session continues)

#### Scenario: Export conversation
- **WHEN** user clicks "Export" in the chat toolbar
- **THEN** the conversation is downloaded as a Markdown file
