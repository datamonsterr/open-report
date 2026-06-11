## ADDED Requirements

### Requirement: Memory MCP verification

Memory MCP (`@modelcontextprotocol/server-memory`) SHALL be verified as operational. It is already configured in the global `~/.config/opencode/opencode.json` with `enabled: true`. No installation or project-level configuration needed.

#### Scenario: Agent uses memory in session
- **WHEN** an agent uses `memory_create_entities` or `memory_*` tools during a session
- **THEN** entities persist in the memory backend and are retrievable across session restarts

#### Scenario: New session loads existing memory
- **WHEN** a new opencode session starts in the project
- **THEN** the agent can query the memory graph and retrieve entities from previous sessions

### Requirement: opencode-mcp evaluation

The project SHALL evaluate `AlaeddineMessadi/opencode-mcp` (npm: `opencode-mcp`) for suitability in bridging local opencode sessions to MCP clients. The evaluation SHALL determine whether open-report's server needs programmatic opencode session spawning.

#### Scenario: Evaluation determines opencode-mcp is redundant (expected)
- **WHEN** evaluation finds that open-report server already proxies to `opencode serve` directly via WebSocket/SSE for session management
- **THEN** opencode-mcp is NOT installed; rationale documented in `docs/technical_spec/opencode-mcp-evaluation.md`
