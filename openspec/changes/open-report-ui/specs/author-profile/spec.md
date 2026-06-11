## ADDED Requirements

### Requirement: Author profile storage
The system SHALL store author profile information in `~/.open-report/config.json`.

#### Scenario: First launch profile setup
- **WHEN** the application launches for the first time
- **THEN** the user is prompted to enter author name, email, and organization

#### Scenario: View author profile
- **WHEN** user opens Settings in the navigation sidebar
- **THEN** the current author profile is displayed with editable fields

#### Scenario: Update author profile
- **WHEN** user modifies author name, email, or organization and saves
- **THEN** the values are persisted to `~/.open-report/config.json` and SQLite

### Requirement: Author auto-fill in reports
The system SHALL automatically populate report metadata with the author's profile.

#### Scenario: Report metadata auto-fill
- **WHEN** a new report is created
- **THEN** the author field in the report metadata is pre-filled with the current author profile

#### Scenario: Override author per report
- **WHEN** user manually changes the author field in report metadata
- **THEN** the override is saved for that report without changing the profile default

### Requirement: Application preferences
The system SHALL persist application preferences across sessions.

#### Scenario: Theme preference
- **WHEN** user selects dark or light theme
- **THEN** the preference is saved and applied on next launch

#### Scenario: Layout preference
- **WHEN** user adjusts panel sizes or collapse state
- **THEN** the layout preferences are saved and restored on next launch
