## Why

open-report currently requires users to interact with raw CLI prompts, wait for batch rendering, then manually open HTML files in a browser to check results. No real-time feedback, no multi-report organization, no version tracking, no template reuse. This makes iterative report authoring slow and frustrating. A web-based UI with integrated chat, live preview, and report management transforms open-report from a CLI script into an interactive authoring tool.

## What Changes

- Clone and adapt opencode-web (SolidJS + Vite + Tailwind) as the UI shell
- Add chat sidebar communicating with opencode sessions via `opencode serve` proxy (WebSocket/SSE)
- Add report preview panel (right sidebar) with live HTML rendering, diagram interactions, and inline editing
- Add collapsible left navigation sidebar for project/report management
- Add top toolbar with export, import, help, and tool actions
- Implement project management (create, list, open, delete) as container grouping reports, GitHub repos, materials, and context
- Implement report management (create, list, open, delete) scoped under projects, backed by Git versioning + SQLite metadata
- Implement template management (create, edit, delete) with skills/rules/subagents configuration
- Implement chat-driven guided initialization wizard for creating new reports
- Implement diagram editing: click opens inline source editor with "Edit with AI" context menu
- Implement interactive HTML editing: hover highlight, click to contentEditable, shift+click multi-select, send to chat
- Package custom skills with `open-report-` prefix in `./skills/` directory, configurable via `.opencode/opencode.json`
- Implement author profile config stored in `~/.open-report/` with SQLite metadata
- Implement auto-versioning: Git commit on each report render with version tags
- Create GitBook documentation project with auto-sync script triggered on openspec archive

## Capabilities

### New Capabilities

- `project-management`: Project as top-level container storing reports under `~/.open-report/{project_name}/{report}/{version}`. Projects link GitHub repos, materials, and user-defined context. Agents use project context during report generation. Hierarchical: project > reports > versions.
- `chat-interface`: Chat panel connecting to opencode sessions via serve proxy. Handles message streaming, tool execution display, session management, and prompt history.
- `report-preview`: HMTL report rendering in iframe/sandbox. Live reload on changes. Diagram source editing with inline editor and AI-assisted mode. ContentEditable-based interactive HTML editing with hover/click/shift-select.
- `report-management`: CRUD operations for reports (output folders). Git-based versioning with auto-commit on render. List, search, delete. Tied to SQLite metadata store.
- `template-management`: Template CRUD. Each template bundles skills, rules, subagent config. Templates drive report initialization and skill loading.
- `author-profile`: Author profile configuration (name, email, org). Stored in `~/.open-report/config.json`. Auto-fills report metadata.
- `guided-initialization`: Chat-driven wizard for creating new reports. AI asks clarifying questions (report type, target project, scope). Creates openspec change and scaffolds output directory.
- `skill-packaging`: Open-report skills (`open-report-*` prefix) packaged in `./skills/`. Configurable via opencode.json skill paths. Includes migration/restructuring of existing skills.
- `gitbook-docs`: Separate GitBook project. Auto-sync script generates/updates documentation from skills, rules, and readme. Triggered on openspec archive.

### Modified Capabilities

<!-- No existing specs to modify. -->

## Impact

- **Code**: New `src/` directory for SolidJS UI app (cloned from opencode-web packages/app), restructured for open-report use case. Changes to `.opencode/opencode.json` for skill paths.
- **Dependencies**: bun, SolidJS, @solidjs/router, @tanstack/solid-query, @kobalte/core, tailwindcss, vite, @solid-primitives/websocket, better-sqlite3 (or drizzle-orm + bun:sqlite), playwright (testing)
- **Infrastructure**: Requires `opencode serve` running for UI operation. SQLite database at `~/.open-report/data.db`. Git repo per project under `~/.open-report/`. Git required for versioning.
- **Skills**: Existing skills in `.opencode/skills/` may need `open-report-` prefix and restructuring into `./skills/`.
- **Breaking**: None. Existing CLI workflow unchanged. UI is additive.
