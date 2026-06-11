## 1. Mise configuration

- [x] 1.1 Create `mise.toml` at project root with `[tools]` section: node = "22", python = "3.12", java = "openjdk"
- [x] 1.2 Add `[env]` section with `OPENREPORT_*` namespace-prefixed variables (OUTPUT_DIR, TEMPLATE_DIR, DEFAULT_REPORT_TYPE, DEFAULT_AUTHOR, TMP_DIR)
- [x] 1.3 Add Python venv config: `_.python.venv = { path = ".venv", create = true }`
- [x] 1.4 Add `[settings]` with `experimental = true` and `trusted_config_paths` pointing to project root
- [x] 1.5 Add `[tasks]` for `generate`, `srs`, `test`, `install-deps`, `clone-mycoai`, `sample`
- [x] 1.6 Remove old `.mise.toml` (hidden file) after confirming new `mise.toml` works
- [x] 1.7 Verify `mise trust && mise install` succeeds and all tools resolve
- [x] 1.8 Verify `mise run generate` executes the Python report script

## 2. Dev subagents

- [x] 2.1 Create `~/.config/opencode/agents/spec-syncer.md` — copies `docs/feature_spec/` → `docs/living_spec/` with metadata headers, skips unchanged files
- [x] 2.2 Create `~/.config/opencode/agents/spec-puller.md` — reads `docs/living_spec/` files and returns content to calling agent
- [x] 2.3 Create `~/.config/opencode/agents/living-spec-init.md` — bootstraps `docs/` directory tree with README files
- [x] 2.4 Verify subagents use `$PROJECT_ROOT` convention, no hardcoded paths
- [x] 2.5 Verify each subagent has correct frontmatter: `name`, `description`, `mode: subagent`, `permission`

## 3. Dev skills

- [x] 3.1 Create `~/.config/opencode/skills/update-living-spec/SKILL.md` — triggers on "update living spec", delegates to spec-syncer subagent
- [x] 3.2 Create `~/.config/opencode/skills/read-living-spec/SKILL.md` — triggers on "read living spec", delegates to spec-puller subagent
- [x] 3.3 Create `~/.config/opencode/skills/init-living-spec/SKILL.md` — triggers on "init living spec", delegates to living-spec-init subagent
- [x] 3.4 Verify skills appear in opencode `available_skills` list when `~/.config/opencode/skills/` is in skill paths

## 4. Living spec docs

- [x] 4.1 Create `docs/README.md` explaining folder structure, workflow steps, and rules (following mycoai_projects pattern)
- [x] 4.2 Create `docs/feature_spec/` directory
- [x] 4.3 Create `docs/feature_spec/00-domain-model.md` by migrating all domain language from CONTEXT.md (terms, relationships, example dialogue, flagged ambiguities)
- [x] 4.4 Create `docs/technical_spec/` directory (empty, ready for decisions)
- [x] 4.5 Create `docs/living_spec/README.md` explaining auto-sync rules and metadata format
- [x] 4.6 Bootstrap initial feature specs from open-report-ui proposal capabilities
- [x] 4.7 Delete CONTEXT.md after confirming 00-domain-model.md covers all domain language
- [x] 4.8 Update `.opencode/opencode.json` instructions to reference `docs/` path for context injection

## 5. MCP servers

- [x] 5.1 Verify memory MCP is operational — confirm `memory_*` tools work in opencode session (already configured globally)
- [x] 5.2 Evaluate `opencode-mcp` (npm: `opencode-mcp`) for session bridging need
- [x] 5.3 Document opencode-mcp evaluation in `docs/technical_spec/` — install if needed, skip with rationale if redundant (expected: skip)
- [x] 5.4 If opencode-mcp is installed, configure in `.opencode/opencode.json` `mcp` block (not installed)

## 6. Verification

- [x] 6.1 Run `mise run test` to verify report generation pipeline works
- [x] 6.2 Verify all three subagents can be dispatched via Task tool from an opencode session
- [x] 6.3 Verify all three skills load and respond to trigger keywords
- [x] 6.4 Verify `docs/` tree structure matches spec
- [x] 6.5 Verify CONTEXT.md is deleted and `docs/feature_spec/00-domain-model.md` contains all domain language
- [x] 6.6 Verify `read-living-spec` subagent pulls correct context from `docs/living_spec/`
