## ADDED Requirements

### Requirement: Chat-driven wizard
The system SHALL guide users through report creation using an AI chat conversation.

#### Scenario: Start guided initialization
- **WHEN** user clicks "New Report" and selects a template (or "Guided")
- **THEN** the chat panel starts a guided conversation with AI asking clarifying questions

#### Scenario: AI asks report type
- **WHEN** guided initialization starts
- **THEN** the AI asks the user what type of report they want (SRS, Architecture, Slides, Custom)

#### Scenario: AI asks target project
- **WHEN** report type is confirmed
- **THEN** the AI asks for the target project (git URL, local path, or skip for manual)

#### Scenario: AI asks scope
- **WHEN** target project is provided
- **THEN** the AI asks about report scope and sections to include with recommendations

#### Scenario: Wizard completes
- **WHEN** all questions are answered
- **THEN** the AI creates the report directory, openspec change, applies template, and confirms readiness

### Requirement: Quick start option
The system SHALL provide a fast-track option to skip the full wizard.

#### Scenario: Quick start creates report
- **WHEN** user clicks "Quick Start" and enters a title
- **THEN** a report is created with default template and no further questions

### Requirement: Wizard state persistence
The system SHALL persist incomplete wizard sessions.

#### Scenario: Resume interrupted wizard
- **WHEN** user closes UI during guided initialization
- **THEN** the wizard state is saved and can be resumed on next launch
