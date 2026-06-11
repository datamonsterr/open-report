# opencode-mcp Evaluation

**Date:** 2026-06-11
**Status:** DECIDED — Skip
**Change:** `configure-project-tooling`

## Decision

opencode-mcp SHALL NOT be installed for this project.

## Rationale

opencode-mcp (npm: `opencode-mcp`) exposes opencode sessions as MCP tools to external MCP clients (Claude Desktop, Cursor, Windsurf, etc.). It lets external AI tools delegate work to OpenCode sessions.

open-report's architecture already handles session management differently:

```
open-report UI → WebSocket/SSE → opencode serve (direct proxy)
```

The open-report server proxies directly to `opencode serve` for all session management. There is no need for opencode-mcp because:

1. **Sessions are user-initiated, not programmatic.** The UI triggers session creation via user action, not programmatic API calls.
2. **opencode serve already exposes sessions.** The server's WebSocket/SSE proxy connects directly to the opencode headless API.
3. **opencode-mcp adds external client bridging.** This is useful when you want Claude Desktop to use OpenCode as a backend. But open-report already has its own UI + chat interface — no need for external MCP clients.

## Alternative

If open-report needs to programmatically spawn opencode sessions (e.g., background jobs), use the `@opencode-ai/sdk` directly instead of opencode-mcp. But this is not needed with the current proxy architecture.

## Cross-references

- [04-chat-interface.md](../feature_spec/04-chat-interface.md) — Chat connects directly to opencode serve
- [06-guided-initialization.md](../feature_spec/06-guided-initialization.md) — Init wizard creates openspec changes, not opencode sessions