## ADDED Requirements

### Requirement: Template listing
The system SHALL display all templates in the navigation sidebar.

#### Scenario: View template list
- **WHEN** user selects Templates in the navigation sidebar
- **THEN** all templates are listed with name, description, and associated skill count

#### Scenario: Template detail view
- **WHEN** user clicks a template
- **THEN** the template's skills, rules, and subagent configurations are displayed in detail

### Requirement: Template creation
The system SHALL allow users to create new templates with configurable skills, rules, and subagents.

#### Scenario: Create template from scratch
- **WHEN** user clicks "New Template" and fills in name, description, selects skills, rules, and subagents
- **THEN** the template is saved to SQLite and appears in the template list

#### Scenario: Create template from existing report
- **WHEN** user right-clicks a report and selects "Save as Template"
- **THEN** a new template is created with the report's current skill/rule/subagent configuration

### Requirement: Template editing
The system SHALL allow users to modify existing templates.

#### Scenario: Edit template configuration
- **WHEN** user selects a template and modifies skills, rules, or subagents
- **THEN** changes are saved to SQLite immediately

#### Scenario: Delete template
- **WHEN** user selects "Delete" on a template
- **THEN** the template is removed from SQLite (existing reports using it are unaffected)

### Requirement: Template application
The system SHALL apply template configuration when creating a new report.

#### Scenario: Apply template to new report
- **WHEN** user creates a report using a template
- **THEN** the template's skills are loaded, rules are applied, and subagent models are configured for that report's session
