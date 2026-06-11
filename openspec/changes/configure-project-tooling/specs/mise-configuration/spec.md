## ADDED Requirements

### Requirement: Project tool versions

The project SHALL define tool versions in `mise.toml` using the `[tools]` section with exact versions:
- Node.js 22
- Python 3.12
- Java openjdk (latest LTS)

#### Scenario: Developer enters project directory
- **WHEN** a developer runs `mise trust` and enters the project directory
- **THEN** mise automatically activates Node 22, Python 3.12, and Java openjdk in the shell environment

#### Scenario: CI runs mise install
- **WHEN** CI pipeline runs `mise install` in the project root
- **THEN** all tools (node, python, java) are installed at specified versions without manual intervention

### Requirement: Project environment variables

The mise configuration SHALL define project-specific environment variables in the `[env]` section with `OPENREPORT_` namespace prefix:
- `OPENREPORT_OUTPUT_DIR` = `"output"`
- `OPENREPORT_TEMPLATE_DIR` = `"report/templates"`
- `OPENREPORT_DEFAULT_REPORT_TYPE` = `"a4"`
- `OPENREPORT_DEFAULT_AUTHOR` = `"Engineering Team"`
- `OPENREPORT_TMP_DIR` = `"tmp"`

#### Scenario: Agent reads project configuration
- **WHEN** an opencode agent references `$OPENREPORT_OUTPUT_DIR`
- **THEN** the variable resolves to `output/` within the project

#### Scenario: New env var added
- **WHEN** a developer adds a new `OPENREPORT_*` variable to `mise.toml`
- **THEN** mise reloads and the variable is available without restarting the shell

### Requirement: Mise tasks for report workflows

The mise configuration SHALL define task aliases in `[tasks]` for common report operations:
- `generate` — generate HTML report from markdown content
- `srs` — generate SRS HTML report from `output/srs/srs-content.md`
- `test` — run report validation checks
- `install-deps` — install Python dependencies from `requirements.txt`

#### Scenario: Developer generates a report
- **WHEN** developer runs `mise run generate`
- **THEN** the Python report generation script executes with appropriate environment variables

#### Scenario: Developer validates a report
- **WHEN** developer runs `mise run test`
- **THEN** validation checks run and report results to stdout

### Requirement: Trusted config paths

The mise configuration SHALL set `trusted_config_paths` to the exact project path and enable `activate_aggressive` for automatic environment activation.

#### Scenario: Developer first enters project
- **WHEN** developer runs `mise trust` once
- **THEN** subsequent directory entries auto-activate the project environment without prompting
