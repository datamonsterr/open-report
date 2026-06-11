# Guided Initialization

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

A chat-driven wizard for creating new reports. The AI asks clarifying questions about report type, target project, and scope, then creates an openspec change and scaffolds the output directory.

## Requirements

### R1: Initiation

When a user clicks "New Report" and picks a template, the guided initialization wizard SHALL start in the chat panel.

### R2: Clarifying questions

The AI SHALL ask clarifying questions:
- Report type (SRS, architecture, etc.)
- Target project (linked GitHub repo)
- Scope and depth of analysis

### R3: Openspec integration

After gathering requirements, the wizard SHALL create an openspec change in the project and scaffold the output directory structure.

### R4: Template-driven

The selected template SHALL determine which skills are loaded into the session for initialization.

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Project, Report, Template, Session definitions
- [03-template-management.md](03-template-management.md) — Templates drive initialization
- [04-chat-interface.md](04-chat-interface.md) — Chat panel hosts the wizard
