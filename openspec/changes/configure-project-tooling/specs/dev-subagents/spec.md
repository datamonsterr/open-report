## ADDED Requirements

### Requirement: spec-syncer subagent

The system SHALL provide a `spec-syncer` subagent stored at `~/.config/opencode/agents/spec-syncer.md` that:
- Copies all files from `docs/feature_spec/` to `docs/living_spec/`
- Adds a metadata comment header to each synced file with timestamp and source path
- Skips sync if source file unchanged (comparing content hash or modification time)
- Reports which files were synced, skipped, or had errors

#### Scenario: New feature spec added
- **WHEN** a new file `docs/feature_spec/01-new-feature.md` is created and spec-syncer runs
- **THEN** the file is copied to `docs/living_spec/01-new-feature.md` with a `<!-- synced: <timestamp> from feature_spec/01-new-feature.md -->` header

#### Scenario: Feature spec modified
- **WHEN** an existing feature spec is modified and spec-syncer runs
- **THEN** the corresponding living spec is overwritten with updated content and a new sync timestamp

#### Scenario: No changes since last sync
- **WHEN** spec-syncer runs and no feature specs have changed
- **THEN** no files are written and the agent reports "0 files synced"

### Requirement: spec-puller subagent

The system SHALL provide a `spec-puller` subagent stored at `~/.config/opencode/agents/spec-puller.md` that:
- Reads `docs/living_spec/README.md` for index
- Reads specific living spec files requested by the caller
- Returns content to the calling agent for context injection
- Works project-agnostically using `$PROJECT_ROOT` convention

#### Scenario: Agent requests living spec context
- **WHEN** an implementation agent invokes spec-puller with file names `01-image-input.md, 02-segmentation.md`
- **THEN** spec-puller reads and returns the content of both files from `docs/living_spec/`

#### Scenario: Agent requests all living specs
- **WHEN** an implementation agent invokes spec-puller without specific file names
- **THEN** spec-puller reads `docs/living_spec/README.md`, identifies all spec files, and returns all content

### Requirement: living-spec-init subagent

The system SHALL provide a `living-spec-init` subagent stored at `~/.config/opencode/agents/living-spec-init.md` that:
- Creates the `docs/` directory structure if it does not exist
- Creates `docs/README.md` explaining the living spec workflow
- Creates `docs/feature_spec/` directory (empty, ready for specs)
- Creates `docs/technical_spec/` directory (empty, ready for specs)
- Creates `docs/living_spec/` directory with `README.md` explaining auto-sync rules
- Works project-agnostically using `$PROJECT_ROOT` convention

#### Scenario: New project needs living spec structure
- **WHEN** living-spec-init runs in a project without `docs/` directory
- **THEN** the full directory tree (`docs/`, `docs/feature_spec/`, `docs/technical_spec/`, `docs/living_spec/`) is created with README files

#### Scenario: Partial structure exists
- **WHEN** living-spec-init runs in a project where `docs/feature_spec/` exists but `docs/living_spec/` is missing
- **THEN** only missing directories are created; existing files are not overwritten

### Requirement: Subagent project-agnostic design

All three subagents SHALL use `$PROJECT_ROOT` (or current working directory) as the base path, never hardcode specific project paths.

#### Scenario: Subagent used in different project
- **WHEN** spec-syncer is invoked from `/home/dat/dev/other-project`
- **THEN** it operates on `/home/dat/dev/other-project/docs/feature_spec/` and `/home/dat/dev/other-project/docs/living_spec/`
