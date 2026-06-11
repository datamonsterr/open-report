## ADDED Requirements

### Requirement: Report listing
The system SHALL display all reports in a navigable list with metadata.

#### Scenario: View report list
- **WHEN** the navigation sidebar is open and Reports is selected
- **THEN** all reports are listed with title, type, last modified date, and version count

#### Scenario: Filter reports
- **WHEN** user types in the report search/filter input
- **THEN** the report list filters to matching titles or types

#### Scenario: Empty state
- **WHEN** no reports exist
- **THEN** a message "No reports yet. Create your first report." is shown with a "New Report" button

### Requirement: Report creation
The system SHALL support creating new reports with guided initialization.

#### Scenario: Create report from template
- **WHEN** user clicks "New Report" and selects a template
- **THEN** the guided initialization wizard starts in chat panel

#### Scenario: Create report with default settings
- **WHEN** user clicks "Quick Start"
- **THEN** a report is created with sensible defaults and no wizard

### Requirement: Report opening
The system SHALL open existing reports with all associated state.

#### Scenario: Open report from list
- **WHEN** user clicks a report in the list
- **THEN** the report's HTML preview loads, chat session opens (or resumes), and metadata is displayed

#### Scenario: Open recently viewed report
- **WHEN** UI starts
- **THEN** the most recently opened report (if any) is restored from SQLite metadata

### Requirement: Report deletion
The system SHALL allow users to delete reports with confirmation.

#### Scenario: Delete report
- **WHEN** user right-clicks a report and selects "Delete"
- **THEN** a confirmation dialog appears and on confirm the output folder and metadata are removed

### Requirement: Git-based versioning
The system SHALL automatically version reports using Git commits.

#### Scenario: Auto-commit on render
- **WHEN** a report render completes successfully
- **THEN** a Git commit is created with message `feat(report): render <title> v<N>` and a tag `report/<id>/v<N>` is applied

#### Scenario: View version history
- **WHEN** user opens version history for a report
- **THEN** a list of versions is shown with commit message, date, and author

#### Scenario: Checkout previous version
- **WHEN** user selects a previous version and clicks "Restore"
- **THEN** the report files are checked out at that version and preview refreshes

### Requirement: Report export
The system SHALL allow exporting reports as standalone files.

#### Scenario: Export as ZIP
- **WHEN** user clicks "Export" in toolbar with a report open
- **THEN** a ZIP file containing all report artifacts is downloaded

#### Scenario: Export as single HTML
- **WHEN** user selects "Export as HTML"
- **THEN** a self-contained HTML file with embedded images is generated and downloaded
