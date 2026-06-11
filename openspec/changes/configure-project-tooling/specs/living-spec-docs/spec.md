## ADDED Requirements

### Requirement: docs directory structure

The project SHALL have a `docs/` directory containing:
- `docs/README.md` — explains the living spec workflow, folder structure, and usage rules
- `docs/feature_spec/` — ground truth feature specifications (human + agent editable)
- `docs/technical_spec/` — technical decisions with open decision points
- `docs/living_spec/` — auto-synced working copies (read-only for implementation agents)
- `docs/living_spec/README.md` — explains auto-sync rules and metadata format

#### Scenario: Developer navigates docs
- **WHEN** a developer opens `docs/README.md`
- **THEN** they see the full folder structure, workflow steps, and rules for reading vs editing each folder

#### Scenario: Agent reads docs for context
- **WHEN** an implementation agent loads project context
- **THEN** `docs/` is included in the AGENTS.md instruction paths for automatic context injection

### Requirement: feature_spec as ground truth

`docs/feature_spec/` SHALL be the source of truth for product feature specifications. All changes to feature behavior SHALL originate in `docs/feature_spec/`. Each file SHALL be self-contained — reading one file gives full understanding of one feature.

#### Scenario: New feature proposed
- **WHEN** a new feature is designed
- **THEN** a new file is created in `docs/feature_spec/` with the feature specification

#### Scenario: Feature behavior changes
- **WHEN** an implementation modifies feature behavior
- **THEN** the corresponding `docs/feature_spec/` file is updated, then synced to `docs/living_spec/`

### Requirement: technical_spec for decisions

`docs/technical_spec/` SHALL capture technical decisions with `[DECISION]` markers. Each document SHALL present alternatives considered and the rationale for the chosen approach.

#### Scenario: Architecture decision needed
- **WHEN** a technical decision point is identified during design
- **THEN** a file is created or updated in `docs/technical_spec/` documenting the decision, alternatives, and rationale

#### Scenario: Decision implemented
- **WHEN** a documented decision is fully implemented
- **THEN** the `[DECISION]` marker is replaced with `[DECIDED]` and the implementation reference is added

### Requirement: living_spec auto-sync

`docs/living_spec/` SHALL contain auto-synced copies of `docs/feature_spec/` files with metadata headers tracking sync date and source. Manual edits to `docs/living_spec/` are NOT permitted and will be overwritten on next sync.

#### Scenario: spec-syncer runs
- **WHEN** spec-syncer subagent is invoked
- **THEN** all files from `docs/feature_spec/` are copied to `docs/living_spec/` with `<!-- synced: <ISO8601> from feature_spec/<filename> -->` headers

#### Scenario: Agent reads current specs
- **WHEN** an implementation agent needs current feature specifications
- **THEN** it reads from `docs/living_spec/` (always up-to-date via sync)

### Requirement: Initial feature spec bootstrap

`docs/feature_spec/` SHALL initially contain feature specs derived from the open-report domain model and existing openspec change specs (open-report-ui). Files SHALL be numbered:
- `00-domain-model.md` — domain language from CONTEXT.md (Project, Report, Template, Artifact, Render, Assemble, Session, relationships, example dialogue, flagged ambiguities)
- Additional feature specs derived from open-report-ui proposal capabilities

#### Scenario: Bootstrap completes
- **WHEN** living-spec-init bootstraps the docs
- **THEN** `docs/feature_spec/` contains `00-domain-model.md` with full domain glossary plus initial feature spec files

### Requirement: CONTEXT.md absorbed into feature_spec

`docs/feature_spec/` SHALL absorb all domain language from `CONTEXT.md` into `docs/feature_spec/00-domain-model.md`. `CONTEXT.md` SHALL be deleted after the migration. Agents SHALL use the `read-living-spec` subagent to pull context instead of reading a single file.

#### Scenario: Agent needs domain context
- **WHEN** an opencode agent session initializes
- **THEN** the agent invokes `read-living-spec` subagent to pull `docs/living_spec/00-domain-model.md` and relevant feature specs

#### Scenario: Developer needs to understand project language
- **WHEN** a developer reads `docs/feature_spec/00-domain-model.md`
- **THEN** they find all domain terms (Project, Report, Template, Artifact, Render, Assemble, Session) with definitions, relationships, and example dialogue migrated from CONTEXT.md
