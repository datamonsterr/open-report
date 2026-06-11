# Report Management

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

Reports are named output folders under a project containing rendered HTML, diagrams, charts, and metadata. Report management provides CRUD operations with Git-based versioning.

## Requirements

### R1: Report CRUD

Users SHALL be able to create, list, open, and delete reports scoped under a project.

### R2: Report storage

Reports SHALL be stored as subdirectories under `~/.open-report/<project_name>/<report_name>/` with Git versioning.

### R3: Report metadata

Each report SHALL have `artifacts.json` metadata tracking artifact id, path, type, alt text, and layout hint.

### R4: Auto-versioning

Git commit SHALL be created automatically on each report render with version tags.

### R5: SQLite metadata

Report metadata SHALL be backed by a SQLite database at `~/.open-report/data.db` for queryable report history.

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Domain language
- [01-project-management.md](01-project-management.md) — Reports belong to Projects
