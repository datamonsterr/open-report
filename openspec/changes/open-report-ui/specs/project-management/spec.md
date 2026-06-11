## ADDED Requirements

### Requirement: Project creation
The system SHALL allow users to create projects as top-level containers for reports.

#### Scenario: Create project with name and description
- **WHEN** user clicks "New Project" and enters name and description
- **THEN** a project directory is created under `~/.open-report/<project_name>/` with `project.json` and initialized as a git repo

#### Scenario: Create project with context
- **WHEN** user provides project context markdown during creation
- **THEN** the context is saved to `project.json` and injected into opencode session system prompts for this project

### Requirement: Project listing
The system SHALL display all projects in a navigable tree structure.

#### Scenario: View project list
- **WHEN** user opens the navigation sidebar
- **THEN** all active projects are listed as top-level nodes with report count

#### Scenario: Expand project to see reports
- **WHEN** user clicks a project node
- **THEN** the project's reports are listed as children underneath

### Requirement: Project configuration
The system SHALL store project configuration in `project.json`.

#### Scenario: Project config schema
- **WHEN** a project is created
- **THEN** `project.json` contains name, description, context (markdown), repos array, and materials array

#### Scenario: Edit project context
- **WHEN** user opens project settings and edits the context markdown field
- **THEN** the updated context is saved to `project.json` and applied to future sessions

### Requirement: Project-linked repositories
The system SHALL allow users to link GitHub repositories to a project.

#### Scenario: Add GitHub repo to project
- **WHEN** user adds a GitHub URL to a project's repo list
- **THEN** the repo is saved in `project.json` with name, URL, and provider fields

#### Scenario: Clone linked repos for agent access
- **WHEN** a report session starts for a project with linked repos
- **THEN** linked repos are cloned to `/tmp/opencode/<project>/<repo_name>/` for agent tool access

#### Scenario: Repo not cloned if already exists
- **WHEN** a linked repo is already cloned at the expected path
- **THEN** the system performs `git pull` instead of fresh clone

### Requirement: Project materials
The system SHALL allow users to attach materials to a project for agent reference.

#### Scenario: Upload PDF material
- **WHEN** user uploads a PDF file to project materials
- **THEN** the file is stored in `~/.open-report/<project>/materials/` and referenced in `project.json`

#### Scenario: Add link material
- **WHEN** user adds a URL as a material reference
- **THEN** the URL is saved in `project.json` materials array with type "link"

#### Scenario: Materials available as file context
- **WHEN** a report session starts
- **THEN** project materials are loaded as available file context for the agent

### Requirement: Project context injection
The system SHALL inject project context into opencode sessions.

#### Scenario: Context in system prompt
- **WHEN** a new opencode session is created for a project's report
- **THEN** the `project.json` context field is included as a system message prefix

#### Scenario: Multiple reports share project context
- **WHEN** multiple reports exist under the same project
- **THEN** each report's session receives the same project context

### Requirement: Project deletion
The system SHALL support project deletion with confirmation.

#### Scenario: Delete project
- **WHEN** user selects "Delete" on a project
- **THEN** a confirmation dialog warns about deleting all reports and asks for confirmation

#### Scenario: Project deletion removes data
- **WHEN** user confirms project deletion
- **THEN** the `~/.open-report/<project>/` directory is removed and SQLite metadata is deleted

### Requirement: Project archive
The system SHALL support archiving projects without deleting data.

#### Scenario: Archive project
- **WHEN** user selects "Archive" on a project
- **THEN** the project is hidden from the active project list but data is preserved on disk

#### Scenario: Restore archived project
- **WHEN** user views archived projects and selects "Restore"
- **THEN** the project reappears in the active project list
