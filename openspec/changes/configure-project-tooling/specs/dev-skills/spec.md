## ADDED Requirements

### Requirement: update-living-spec skill

The system SHALL provide an `update-living-spec` skill at `~/.config/opencode/skills/update-living-spec/SKILL.md` that:
- Triggers on keywords: "update living spec", "sync specs", "sync living spec"
- Delegates to the `spec-syncer` subagent via Task tool
- Provides user-facing instructions about when to sync (after proposal acceptance, after implementation changes product behavior)
- Reports sync results to the user

#### Scenario: User requests sync after feature change
- **WHEN** user says "update living spec after the auth changes"
- **THEN** the skill detects the trigger, dispatches spec-syncer, and reports which files were synced

#### Scenario: Agent-initiated sync
- **WHEN** an agent completes implementation of a feature that changes product behavior
- **THEN** the agent invokes update-living-spec skill to sync feature_spec → living_spec

### Requirement: read-living-spec skill

The system SHALL provide a `read-living-spec` skill at `~/.config/opencode/skills/read-living-spec/SKILL.md` that:
- Triggers on keywords: "read living spec", "pull specs", "get specs", "load specs"
- Delegates to the `spec-puller` subagent via Task tool
- Provides instructions for agents to read living specs before starting implementation
- Accepts optional file name parameters to read specific specs

#### Scenario: Agent starts new implementation task
- **WHEN** an agent begins implementing a feature
- **THEN** it invokes read-living-spec to load `docs/living_spec/` content as implementation context

#### Scenario: User wants to review specs
- **WHEN** user says "read living spec for authentication"
- **THEN** the skill loads the relevant living spec files and presents them

### Requirement: init-living-spec skill

The system SHALL provide an `init-living-spec` skill at `~/.config/opencode/skills/init-living-spec/SKILL.md` that:
- Triggers on keywords: "init living spec", "setup living spec", "initialize docs"
- Delegates to the `living-spec-init` subagent via Task tool
- Provides instructions for bootstrapping the docs structure in new or existing projects
- Reports created directories and files to the user

#### Scenario: New project setup
- **WHEN** user says "init living spec for this project"
- **THEN** the skill dispatches living-spec-init, which creates the full `docs/` tree structure

#### Scenario: Project already has docs
- **WHEN** init-living-spec runs in a project that already has `docs/`
- **THEN** it reports which directories already exist and only creates missing ones

### Requirement: Skill discoverability in opencode

All three skills SHALL appear in opencode's `available_skills` list when `~/.config/opencode/skills/` is in the skill paths configuration. Each SKILL.md SHALL include a `description` frontmatter field matching the trigger keywords.

#### Scenario: Agent lists available skills
- **WHEN** an agent session starts and loads skills from `~/.config/opencode/skills/`
- **THEN** `update-living-spec`, `read-living-spec`, and `init-living-spec` appear in the available skills list
