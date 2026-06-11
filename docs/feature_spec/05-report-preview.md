# Report Preview

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

A right sidebar panel providing live HTML report rendering, interactive diagram editing, and contentEditable-based HTML editing with AI-assisted mode.

## Requirements

### R1: Live HTML rendering

The preview panel SHALL render HTML reports in an iframe/sandbox with live reload on changes.

### R2: Diagram editing

Clicking a diagram in the preview SHALL open an inline source editor. Context menu SHALL include "Edit with AI" option.

### R3: Interactive HTML editing

Hover over elements SHALL highlight them. Click SHALL enable contentEditable mode. Shift+click SHALL allow multi-select.

### R4: Chat integration

Selected content SHALL be sendable to the chat panel with context ("Fix this diagram", "Rewrite this section").

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Artifact, Render, Assemble definitions
- [04-chat-interface.md](04-chat-interface.md) — Preview content sent to chat for editing
