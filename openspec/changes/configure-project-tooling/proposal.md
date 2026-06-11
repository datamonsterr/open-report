## Why

open-report lacks project-level tooling configuration: no mise tool versioning, no dev-oriented subagents (spec-syncer, spec-puller, living-spec-init), no living spec documentation system, no MCP servers for graph-based memory or session bridging. Devlens and mycoai_projects already follow these patterns. Standardizing tooling across projects establishes reproducible dev environments, living specs as source of truth, and AI-friendly codebase memory.

## What Changes

- Create `mise.toml` with Node 22, Python 3.12, Java openjdk tool versions, project env vars, and mise tasks for report generation
- Create dev subagents (spec-syncer, spec-puller, living-spec-init) in `~/.config/opencode/agents/` with identical structure reusable across any project
- Create dev skills (update-living-spec, read-living-spec, init-living-spec) in `~/.config/opencode/skills/` with identical structure reusable across any project
- Create `docs/` directory with `docs/README.md`, `docs/feature_spec/`, `docs/technical_spec/`, and `docs/living_spec/` following devlens/mycoai pattern
- Move CONTEXT.md domain language into `docs/feature_spec/00-domain-model.md`, then delete CONTEXT.md — feature_spec becomes the sole source of truth
- Bootstrap initial feature specs from existing openspec change specs (open-report-ui) and the domain model
- Verify memory MCP (`@modelcontextprotocol/server-memory`) is already configured globally in `~/.config/opencode/opencode.json`
- Evaluate `opencode-mcp` for session bridging; document decision in `docs/technical_spec/`
- Update `.opencode/opencode.json` instructions to reference `docs/` path

## Capabilities

### New Capabilities

- `mise-configuration`: Project tool versioning via mise.toml with Node 22, Python 3.12, Java openjdk, project env vars, and mise tasks for report generation/validation workflows.
- `dev-subagents`: Three reusable subagents (spec-syncer, spec-puller, living-spec-init) stored in `~/.config/opencode/agents/` with project-agnostic design. spec-syncer copies `docs/feature_spec/` → `docs/living_spec/` with metadata. spec-puller reads living specs for implementation context. living-spec-init bootstraps the docs structure for new projects.
- `dev-skills`: Three reusable skills (update-living-spec, read-living-spec, init-living-spec) stored in `~/.config/opencode/skills/` with project-agnostic design. Each skill wraps its corresponding subagent with task-appropriate instructions.
- `living-spec-docs`: Documentation structure under `docs/` with feature specs (ground truth, absorbs CONTEXT.md domain model), technical specs (decisions), living specs (auto-synced working copies), and README.md explaining the workflow. Agents use `read-living-spec` subagent to pull context instead of reading a single file.
- `mcp-servers`: Verify memory MCP is already configured globally. Evaluate `opencode-mcp` for session bridging; document decision in `docs/technical_spec/`.

### Modified Capabilities

<!-- No existing specs to modify. -->

## Impact

- **Config**: New `mise.toml` at project root. Updated `.opencode/opencode.json` instructions to reference `docs/` path.
- **Docs**: New `docs/` directory tree (`README.md`, `feature_spec/`, `technical_spec/`, `living_spec/`, `living_spec/README.md`). CONTEXT.md domain language moved into `docs/feature_spec/00-domain-model.md`, then CONTEXT.md deleted.
- **Dotfiles**: New agents in `~/.config/opencode/agents/` (resolves to `~/dotfiles/.config/opencode/agents/`): `spec-syncer.md`, `spec-puller.md`, `living-spec-init.md`. New skills in `~/.config/opencode/skills/`: `update-living-spec/`, `read-living-spec/`, `init-living-spec/`.
- **Dependencies**: `opencode-mcp` (npm, evaluated for session bridging). Memory MCP already configured globally — no new install.
- **Breaking**: None. Additive change only.
