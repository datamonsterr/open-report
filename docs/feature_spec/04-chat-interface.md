# Chat Interface

**Status:** Proposed (from open-report-ui)
**Source:** `openspec/changes/open-report-ui/proposal.md`

## Overview

A chat panel in the UI sidebar that connects to opencode sessions via `opencode serve` proxy (WebSocket/SSE). Handles message streaming, tool execution display, and session management.

## Requirements

### R1: Session connection

The chat panel SHALL connect to opencode sessions via `opencode serve` proxy using WebSocket or SSE transport.

### R2: Message streaming

Messages from the agent SHALL stream in real-time as they are generated.

### R3: Tool execution display

Tool calls made by the agent SHALL be displayed inline with expand/collapse for outputs.

### R4: Session management

Users SHALL be able to create, switch, and close sessions within the chat panel.

### R5: Prompt history

Previous prompts and responses SHALL be stored and scrollable within the session.

## Cross-references

- [00-domain-model.md](00-domain-model.md) — Session definition
- [05-report-preview.md](05-report-preview.md) — Chat drives preview updates
- [06-guided-initialization.md](06-guided-initialization.md) — Chat hosts the init wizard
