## ADDED Requirements

### Requirement: Auto-sync on archive
The system SHALL automatically update GitBook documentation when an openspec change is archived.

#### Scenario: Archive triggers documentation update
- **WHEN** `openspec archive` completes for a change
- **THEN** a post-archive hook runs the GitBook sync script

#### Scenario: Sync script generates docs
- **WHEN** the sync script runs
- **THEN** it extracts documentation from skills (SKILL.md), rules, and README, and writes them to the GitBook project's content directory

### Requirement: GitBook project structure
The system SHALL maintain a separate GitBook project with structured documentation.

#### Scenario: GitBook table of contents
- **WHEN** docs are synced
- **THEN** the GitBook SUMMARY.md is updated with all available skills, guides, and references

#### Scenario: Skill documentation pages
- **WHEN** a skill has a SKILL.md
- **THEN** a corresponding GitBook page is created from the skill's content

### Requirement: Documentation coverage
The system SHALL document all open-report skills and workflows.

#### Scenario: New skill adds doc page
- **WHEN** a new `open-report-*` skill is added to `./skills/`
- **THEN** the next archive triggers documentation generation for that skill

#### Scenario: Usage guide generation
- **WHEN** documentation sync runs
- **THEN** usage guides for report generation, template creation, and guided initialization are updated from the latest UI workflows
