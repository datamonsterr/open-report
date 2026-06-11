## Context

open-report is a SolidJS + Vite + Tailwind web app with a Bun server backend. It uses opencode as its agent harness with custom subagents (diagram-renderer, report-renderer, tester, srs-writer, project-analyzer, repo-cloner) and skills in `.opencode/skills/` and `./skills/`. Devlens and mycoai_projects already follow mise.toml + living spec + MCP patterns. This change standardizes those patterns here.

Current state:
- `.mise.toml` exists with basic Python env, Java, and mise tasks but lacks Node/Bun versioning and structured env vars
- `.opencode/opencode.json` configured with agent models and skill paths
- Memory MCP already configured globally in `~/.config/opencode/opencode.json`
- `~/.config/opencode/` is now a symlink to `~/dotfiles/.config/opencode/` for git-tracked dotfiles management
- No `docs/` directory exists
- No living spec system (feature_spec, technical_spec, living_spec)
- Dev subagents and skills not yet defined in dotfiles

## Goals / Non-Goals

**Goals:**
- Standardize mise.toml with Node 22, Python 3.12, Java openjdk, and structured env vars namespace-prefixed with `OPENREPORT_`
- Create three reusable dev subagents (spec-syncer, spec-puller, living-spec-init) in `~/.config/opencode/agents/` that work across any project
- Create three reusable dev skills (update-living-spec, read-living-spec, init-living-spec) in `~/.config/opencode/skills/` that wrap subagents
- Bootstrap `docs/` tree: `docs/README.md`, `docs/feature_spec/`, `docs/technical_spec/`, `docs/living_spec/`, `docs/living_spec/README.md`
- Move CONTEXT.md domain language into `docs/feature_spec/00-domain-model.md`, delete CONTEXT.md
- Derive initial feature specs from existing open-report-ui openspec change
- Verify memory MCP is operational (already configured globally)
- Evaluate `opencode-mcp` for session bridging and document decision in `docs/technical_spec/`

**Non-Goals:**
- Filling in full feature spec content beyond initial scaffold (that belongs to live spec maintenance)
- Creating CI/CD pipelines for spec syncing
- Installing MCP servers beyond memory and opencode-mcp
- Migrating existing skills to new structure
- Changing opencode subagent model configs

## Decisions

### D1: mise.toml structure — project-scoped with namespace-prefixed env vars

**Choice:** Single `mise.toml` at project root with `[tools]`, `[env]`, `[tasks]`, `[settings]` sections.

**Rationale:** Devlens already uses this pattern. mise.toml placed at project root means `mise trust` enables auto-activation on directory entry. Namespace-prefixed env vars (`OPENREPORT_*`) prevent collisions.

**Alternatives considered:**
- `.mise.toml` (hidden file): Already exists but inconsistent with devlens convention. Keep `mise.toml` at root for visibility.
- `.env` + mise hybrid: Adds complexity. Single source of truth in mise.toml is cleaner.

### D2: Dev subagents — dotfiles-scoped with project-agnostic design

**Choice:** Store `spec-syncer.md`, `spec-puller.md`, `living-spec-init.md` in `~/.config/opencode/agents/` using paths relative to `$PROJECT_ROOT` instead of hardcoded project paths.

**Rationale:** Same folder structure across all projects (`docs/feature_spec/`, `docs/living_spec/`). Subagents reference these relative paths so they work for any project that follows the convention. Storing in dotfiles (`~/.config/opencode/`) means one definition shared across all projects, consistent with how `diagram-renderer.md`, `report-renderer.md`, etc. already live in both `~/.config/opencode/agents/` and `~/.opencode/agents/`.

**Alternatives considered:**
- Per-project subagents in `.opencode/agents/`: Redundant. Would require copying identical agent defs to every project.
- Hardcoded paths: Not portable across projects. Rejected.

### D3: Dev skills — dotfiles-scoped with subagent delegation

**Choice:** Create `update-living-spec/`, `read-living-spec/`, `init-living-spec/` skill directories in `~/.config/opencode/skills/`. Each SKILL.md delegates to its corresponding subagent via Task tool.

**Rationale:** Skills provide discoverability (visible in `available_skills`), instructions, and user-facing documentation. Subagents handle the actual work. This separation follows opencode's architecture where skills are loaded into session context and subagents are dispatched for tasks.

**Alternatives considered:**
- Skills only (no subagents): Would inline all logic in SKILL.md, making skills too large and losing subagent parallelization.
- Subagents only (no skills): Harder to discover. User must know subagent names.

### D4: Living spec docs — absorbs CONTEXT.md

**Choice:** `docs/feature_spec/` (ground truth, human + agent editable) absorbs the entire CONTEXT.md domain language. CONTEXT.md is deleted. `docs/technical_spec/` (technical decisions), `docs/living_spec/` (auto-synced copies, read-only for implementation agents).

**Rationale:** CONTEXT.md as a single file becomes a bottleneck — agents must parse one large file for context. Splitting domain language into `docs/feature_spec/00-domain-model.md` and feature specs into numbered files lets agents use `read-living-spec` subagent to pull only relevant context. mycoai_projects validated this pattern.

**Alternatives considered:**
- Keep CONTEXT.md + add docs/: Two competing sources of truth. Rejected.
- Single `docs/specs/` directory: Loses the auto-sync safety net between ground truth and working copies.

### D5: Memory MCP — already configured, verify only

**Choice:** Memory MCP (`@modelcontextprotocol/server-memory`) is already configured globally in `~/.config/opencode/opencode.json` with `enabled: true`. No installation or configuration needed. Only verify it works in this project's sessions.

**Rationale:** Global config loaded before per-project config. Since open-report doesn't need a different memory path, the global config suffices.

### D6: opencode-mcp evaluation — skip by default

**Choice:** Evaluate and likely skip. open-report server already proxies to `opencode serve` directly via WebSocket/SSE for session management. `opencode-mcp` bridges opencode sessions to external MCP clients (Claude Desktop, Cursor, etc.), which is orthogonal to open-report's architecture.

**Decision criteria:**
- open-report server needs to spawn opencode sessions programmatically → install
- Sessions are user-initiated via UI, server proxies to `opencode serve` → skip
- Current architecture matches the latter → document skip rationale in `docs/technical_spec/`

## Risks / Trade-offs

- **[R1] mise.toml activating in wrong directory**: If `mise.toml` has `trusted_config_paths` pointing to a parent directory, it could activate unexpectedly. → Mitigation: Set `trusted_config_paths` to exact project path.
- **[R2] spec-syncer overwriting hand-edited living specs**: If someone edits `living_spec/` directly, sync will overwrite. → Mitigation: `living_spec/README.md` clearly states "do not edit directly". spec-syncer includes warning on overwrite.
- **[R3] Dotfiles subagents stale across projects**: If folder structure conventions change, old subagents break. → Mitigation: Subagents document the convention they depend on. Version the convention in `docs/feature_spec/00-domain-model.md`.
