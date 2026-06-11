## Context

open-report is a CLI-based report generation tool producing HTML reports with diagrams, charts, and structured content. Users interact via terminal prompts, wait for batch rendering, then manually open output files. No real-time preview, no project/report management, no template reuse. The codebase currently contains Python scripts, PlantUML/Mermaid rendering, and HTML templates under `templates/`. Reports output to `output/<report>/` with `artifacts.json` metadata.

The project uses opencode as its AI agent harness, configured in `.opencode/opencode.json` with skills in `.opencode/skills/` and rules in `rules/`. Existing skills: `open-report`, `writing-srs`, `openspec-*`. Subagents: `diagram-renderer`, `report-renderer`, `tester`, `srs-writer`, `project-analyzer`, `repo-cloner`.

Target users: developers and technical writers authoring SRS documents, architecture reports, and slide decks from codebase analysis. Pain points: slow iteration cycle, no visual feedback during authoring, difficulty managing multiple reports, no version tracking, no reusable templates.

## Goals / Non-Goals

**Goals:**
- Web-based UI with chat panel (left), report preview (right), collapsible navigation sidebar
- Real-time opencode session integration via `opencode serve` WebSocket/SSE proxy
- Live HTML report preview with diagram interaction and inline editing
- Report management with Git-based versioning and SQLite metadata
- Project management as top-level container grouping reports, repos, materials
- Reusable templates bundling skills, rules, and subagent configs
- Chat-driven guided initialization for new reports
- Author profile config stored in `~/.open-report/`
- Custom skills packaged as `open-report-*` in `./skills/`
- GitBook documentation auto-sync on openspec archive

**Non-Goals:**
- Replacing opencode CLI — UI is additive, not a rewrite
- Real-time collaborative editing (multi-user)
- Cloud/hosted deployment (local-first)
- Native mobile apps
- Migration of existing Python rendering pipeline — only adding UI layer
- Authentication or multi-user support (single local user)

## Decisions

### 1. UI Framework: SolidJS (match opencode-web)

**Choice**: SolidJS + Vite + Tailwind, cloned and restructured from `anomalyco/opencode` `packages/app`.

**Rationale**: The user chose "clone opencode-web." opencode-web uses SolidJS, a reactive UI library with no virtual DOM, compiled reactivity, and small bundle size. Using the same stack means we can reuse opencode's chat components, session management, WebSocket primitives, and build tooling with minimal refactoring.

**Alternatives considered**:
- React + TypeScript: More popular but requires rewriting all chat UI components. SolidJS is already proven for this exact use case (chat + agent sessions).
- SvelteKit: Different paradigm, no reuse of opencode-web components.
- Build from scratch: Wasteful. opencode-web already has chat, sessions, agents, permissions, and streaming.

**Key dependencies**: `solid-js`, `@solidjs/router`, `@tanstack/solid-query`, `@kobalte/core` (headless UI), `tailwindcss`, `vite`, `@solid-primitives/websocket`, `@solid-primitives/storage`, `shiki` (syntax highlighting), `marked` (markdown).

### 2. Runtime Architecture: opencode serve proxy

**Choice**: UI connects to `opencode serve` (headless server on port 4096) via WebSocket for real-time streaming and REST for config/status. No LLM API calls from UI directly.

**Rationale**: opencode already manages providers, models, agent dispatch, tool execution, and session state. Reimplementing this in the UI would duplicate the entire agent framework. The serve mode is designed exactly for this — remote clients attach and control sessions.

**Architecture**:
```
Browser (SolidJS UI) ←─ WebSocket/SSE ─→ opencode serve (port 4096) ←─ LLM APIs
                                              └── Session state, tools, agents
```

**Alternatives considered**:
- Embedded child process: Harder lifecycle management, no streaming abstraction, multi-session complexity.
- Direct LLM API: Loses opencode's agent/skill/tool ecosystem. Defeats the purpose.

### 3. Layout: Three-panel design

```
┌──────────┬───────────────┬──────────────────┐
│ Nav      │ Chat Panel    │ Report Preview   │
│ Sidebar  │               │                  │
│          │ ┌───────────┐ │ ┌──────────────┐ │
│ Reports  │ │ Messages  │ │ │   Rendered   │ │
│ Templ.   │ │           │ │ │   HTML       │ │
│ Settings │ │           │ │ │              │ │
│          │ │           │ │ │              │ │
│          │ └───────────┘ │ └──────────────┘ │
│          │ ┌───────────┐ │ ┌──────────────┐ │
│          │ │ Input     │ │ │  Inspector   │ │
│          │ └───────────┘ │ └──────────────┘ │
├──────────┴───────────────┴──────────────────┤
│ Top Toolbar: [Export] [Import] [Help] [Settings] │
└──────────────────────────────────────────────┘
```

- **Nav sidebar** (collapsible, leftmost): Project list (top-level), report list (per-project), template list, settings. 240px, collapses to 48px (icons only). Tree hierarchy: Project > Reports.
- **Chat panel** (center-left): opencode session chat. Messages, tool executions, streaming. Resizable.
- **Report preview** (right): Rendered HTML in sandboxed iframe. Split with inspector/diagram editor below.

### 4. Data Model

**Storage hierarchy** — files live under `~/.open-report/`:
```
~/.open-report/
├── data.db                    # SQLite metadata (global)
├── config.json                # Author profile, app prefs
└── <project_name>/            # Git repo per project
    ├── .git/
    ├── project.json           # Project config (name, desc, context, repos, materials)
    └── <report_name>/         # Report folder
        └── v<N>/              # Version folder (tagged in git)
            ├── index.html
            ├── artifacts.json
            ├── diagrams/
            └── charts/
```

**SQLite** (`~/.open-report/data.db`) — metadata only:

```sql
projects(id, name, description, git_repo_path, created_at, updated_at)
project_repos(project_id, name, url, local_path, provider, created_at)
project_materials(project_id, name, type, path, description, created_at)
reports(id, project_id, title, type, template_id, created_at, updated_at, version_count, author_id)
templates(id, name, description, skills_json, rules_json, subagents_json, created_at)
authors(id, name, email, org, avatar_url, created_at)
sessions(id, report_id, opencode_session_id, status, created_at)
versions(id, report_id, git_commit, version_number, message, created_at)
settings(key, value)  -- key-value store for app prefs
```

**File system**:
- `~/.open-report/<project>/` — Git repo. `project.json` defines name, description, context (free-form markdown the agent can reference), linked repos (GitHub URLs), materials (docs, PDFs, links)
- `~/.open-report/<project>/<report>/v<N>/` — Report content (HTML, diagrams, charts, artifacts.json)
- `./skills/open-report-*/` — User-facing open-report skills
- `.opencode/skills/` — opencode-native skills
- `~/.open-report/config.json` — Author profile, app prefs (backed by SQLite)

**Git**: Each `~/.open-report/<project>/` is a git repo. Auto-commit on render with message: `feat(report): render <report> v<N>`. Tag: `v/<report>/<N>`.
**Project context**: `project.json` defines a `context` field (markdown) injected into opencode session system prompt. Agent uses it to understand project domain, conventions, constraints.

### 5. Template System

Template = named bundle of:
- **Skills**: Array of skill directory names in `./skills/` to activate
- **Rules**: Array of rule file names in `rules/` to include
- **Subagents**: Agent model/config overrides from `.opencode/opencode.json`

Stored as JSON in SQLite `templates` table. Example SRS template:
```json
{
  "name": "srs",
  "skills": ["open-report-writing-srs", "open-report-render-mermaid"],
  "rules": ["report.md", "srs.md"],
  "subagents": { "srs-writer": { "model": "9router/SuperBrain" } }
}
```

### 6. Project System

**Choice**: Project is top-level container. Reports live under projects. Each project is its own git repo under `~/.open-report/<project_name>/`.

**Rationale**: Documents like SRS, high-level design, weekly reports all belong to a real project. A project has a GitHub repo, materials (docs, PDFs), and user-defined context. Agent uses project context to stay domain-aware across reports.

**`project.json` schema**:
```json
{
  "name": "devlens",
  "description": "DevLens observability platform",
  "context": "DevLens is a Kubernetes-native...",
  "repos": [
    { "name": "main", "url": "https://github.com/anomalyco/devlens", "provider": "github" }
  ],
  "materials": [
    { "name": "PRD", "type": "pdf", "path": "materials/prd.pdf", "description": "Product requirements" },
    { "name": "Architecture Notes", "type": "markdown", "path": "materials/architecture.md" }
  ]
}
```

**Context injection**: On session start, project's `context` field is injected into opencode system prompt. Repos are cloned to `~/tmp/opencode/<project>/<repo>/` for agent access. Materials are loaded as file context.

**Project CRUD**:
- Create: wizard asks project name, description, repos (optional), context (optional). Creates git repo + `project.json`.
- List: shown in nav sidebar as tree root, reports as children.
- Delete: removes `~/.open-report/<project>/` directory and SQLite metadata. Confirmation required.
- Archive: marks project inactive, hides from list (recoverable).

### 7. Versioning Strategy

Git-based with auto-commit on render. Each project is a git repo under `~/.open-report/<project>/`:
1. Before render: check for uncommitted changes in `<project>/<report>/`
2. After render: `git add <report>/ && git commit -m "feat(report): render <report> v<N>"`
3. Tag: `git tag v/<report>/<N>` for easy checkout
4. Version metadata stored in SQLite `versions` table

Rollback: checkout previous tag, SQLite marks current version.

### 8. Diagram Editing

Click on diagram in HTML preview:
- Opens inline source editor panel below preview (for quick edits, shows PlantUML/Mermaid source)
- Context menu has "Edit with AI" — sends diagram source to chat session as message
- After edit: re-render diagram via diagram-renderer subagent, update in HTML
- Supported: PlantUML (.puml), Mermaid (.mmd), Python diagrams (Diagrams library)

### 9. HTML Interactive Editing

- **Hover**: Highlight element under cursor (outline + tooltip showing tag/classes)
- **Click**: Select element, enable contentEditable on text nodes
- **Shift+Click**: Multi-select elements (add to selection set)
- **Selection action**: "Send to AI" button in toolbar — copies selected HTML source to chat with context
- **Edits applied via chat**: AI generates replacement HTML, preview updates

### 10. Skill Packaging

Skills in `./skills/` with `open-report-` prefix:
```
./skills/
  open-report-srs-writer/     -- SRS writing workflow
  open-report-render-mermaid/ -- Mermaid rendering
  open-report-render-plantuml/-- PlantUML rendering
  open-report-render-charts/  -- Chart generation
  open-report-assemble/       -- HTML report assembly
  open-report-validate/       -- Report validation
```

Each skill is a valid opencode skill (SKILL.md + optional scripts/reference). opencode.json updated to load from both paths:
```json
"skills": { "paths": [".opencode/skills", "./skills"] }
```

### 11. Component Architecture

```
App
├── Toolbar (top)
│   ├── ReportActions (export, import, new)
│   ├── ViewControls (split pane ratio, collapse sidebars)
│   └── HelpMenu (docs, about, shortcuts)
├── NavSidebar (left, collapsible)
│   ├── ProjectList (tree root)
│   │   └── ReportList (per project)
│   ├── TemplateList
│   └── SettingsPanel
├── ChatPanel (center)
│   ├── SessionHeader
│   ├── MessageList (streaming, tool calls, artifacts)
│   ├── MessageInput
│   └── PromptTemplates
├── PreviewPanel (right)
│   ├── HtmlPreview (sandboxed iframe)
│   ├── DiagramEditor (inline source + live preview)
│   ├── HtmlInspector (element selection + contentEditable)
│   └── VersionHistory
└── InitWizard (modal, chat-driven)
```

### 12. Communication Protocol

**WebSocket** (primary, from opencode serve):
```
Client → Server: { type: "chat", sessionId: "...", message: "..." }
Server → Client: { type: "chunk", sessionId: "...", delta: "..." }
Server → Client: { type: "tool_call", sessionId: "...", tool: "...", args: {...} }
Server → Client: { type: "tool_result", sessionId: "...", result: "..." }
Server → Client: { type: "done", sessionId: "..." }
```

**REST** (supplementary):
- `GET /api/projects` — list projects
- `POST /api/projects` — create project
- `GET /api/projects/:id/reports` — list reports in project
- `POST /api/projects/:id/reports` — create report
- `GET /api/templates` — list templates
- `GET /api/status` — opencode serve health check

**File watcher** (for live preview):
- `chokidar` (or bun file watcher) on `~/.open-report/<project>/<report>/v<N>/` directory
- On change → iframe reloads or partial update via postMessage

## Risks / Trade-offs

- **SolidJS learning curve**: Smaller ecosystem than React. Fewer UI component libraries. Mitigation: @kobalte/core provides headless primitives; we build custom open-report components on top.
- **opencode-web coupling**: Cloning and restructuring opencode-web means tracking upstream changes. Mitigation: Minimal clone — extract only chat/session components, not full opencode feature set. Restructure under our own namespace.
- **opencode serve availability**: UI requires opencode serve running. If serve crashes, UI is dead. Mitigation: Auto-start serve on UI launch, health check with reconnection, clear error state in UI.
- **Git dependency**: Versioning requires git. Users without git get degraded experience. Mitigation: Detect git availability; fall back to timestamped copies if git not found.
- **SQLite writes from browser**: Browser can't write SQLite directly. Mitigation: Thin Bun/Node backend process handles SQLite + file operations + git commands. UI communicates with it via REST.
- **iframe sandboxing**: Previewing arbitrary HTML in iframe has security implications. Mitigation: Sandbox iframe with `sandbox="allow-scripts"` (no same-origin, no navigation). Serve report files from local static file server.
- **Diagram rendering latency**: Re-rendering diagrams on edit takes seconds. Mitigation: Show loading state in diagram editor panel. Cache rendered SVGs keyed by source hash.

## Open Questions

1. Should the thin backend be a separate Bun process or embedded in the Vite dev server as middleware? → Recommend separate Bun HTTP server for clean separation.
2. How to handle opencode serve session persistence across UI restarts? → Rely on opencode's session management; UI stores session IDs in SQLite.
3. What exactly from opencode-web packages/app do we clone vs rebuild? → Clone: chat streaming, WebSocket client, session state, tool call display. Rebuild: layout, project/report management, preview panel, template system.
4. How to handle project-contxt injection into opencode session? → Pass `project.json` context field as system message prefix when creating session.
