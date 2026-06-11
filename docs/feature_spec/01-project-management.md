# Project Management

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

Projects are top-level containers that organize reports, linked GitHub repos, materials, and user-defined context. Each project is stored under `~/.open-report/<project_name>/` as a git repo with `project.json` config.

## Requirements

### R1: Project CRUD

Users SHALL be able to create, list, open, and delete projects via the left navigation sidebar.

### R2: Project storage

Each project SHALL be stored at `~/.open-report/<project_name>/` as an independent git repository.

### R3: Project config

Each project SHALL have a `project.json` config file containing:
- Project name and description
- Linked GitHub repo URLs
- Materials (files, folders, URLs) used as report inputs
- User-defined context notes

### R4: Project hierarchy

Projects SHALL follow the hierarchy: project > reports > versions.

### R5: Agent context

Projects SHALL provide linked repos and context to agents during report generation. The agent harness reads project config to understand available inputs.

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Domain language
- [02-report-management.md](02-report-management.md) — Reports belong to Projects
