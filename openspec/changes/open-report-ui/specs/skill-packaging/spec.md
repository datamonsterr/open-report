## ADDED Requirements

### Requirement: Skill naming convention
All open-report skills SHALL use the `open-report-` prefix in their directory names.

#### Scenario: Skill naming validation
- **WHEN** a skill is created or added to `./skills/`
- **THEN** the directory name MUST match pattern `open-report-<name>`

### Requirement: Skill directory structure
Each skill in `./skills/` SHALL contain a valid `SKILL.md` file.

#### Scenario: Skill structure check
- **WHEN** the system loads skills from `./skills/`
- **THEN** only directories containing `SKILL.md` are recognized as valid skills

#### Scenario: Import skill from external source
- **WHEN** user installs a skill from an external source
- **THEN** the skill is placed in `./skills/open-report-<name>/` with all required files

### Requirement: Dual skill path loading
The system SHALL configure opencode to load skills from both `.opencode/skills/` and `./skills/`.

#### Scenario: opencode.json configuration
- **WHEN** the application starts
- **THEN** `.opencode/opencode.json` contains `"skills": { "paths": [".opencode/skills", "./skills"] }`

#### Scenario: Skill discovery
- **WHEN** opencode loads skills
- **THEN** skills from both `.opencode/skills/` and `./skills/` are available in every session

### Requirement: Existing skill migration
The system SHALL support migrating existing skills to open-report naming.

#### Scenario: Migrate existing skill
- **WHEN** user runs skill migration
- **THEN** existing skills in `.opencode/skills/` are copied to `./skills/` with `open-report-` prefix and metadata updated

#### Scenario: Migration preserves functionality
- **WHEN** a skill is migrated
- **THEN** the skill's SKILL.md content, scripts, and references are preserved unchanged
