# Template Management

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

Templates are named bundles of skills, rules, and subagent configurations used to drive report creation. Template management provides CRUD operations for configuring report generation workflows.

## Requirements

### R1: Template CRUD

Users SHALL be able to create, edit, and delete templates.

### R2: Template composition

Each template SHALL bundle:
- Skills (open-report-* prefixed skill directories)
- Rules (project-specific rule files)
- Subagent configurations (model, permissions)

### R3: Template storage

Templates SHALL be stored in SQLite metadata alongside reports.

### R4: Report initialization

When creating a new report, the selected template SHALL load its skills into the opencode session context.

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Domain language
- [06-guided-initialization.md](06-guided-initialization.md) — Templates drive report init
