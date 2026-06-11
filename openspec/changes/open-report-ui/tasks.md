## 1. Project Scaffold

- [x] 1.1 Clone opencode-web `packages/app` from `anomalyco/opencode` into `/tmp/opencode/opencode-app`
- [x] 1.2 Extract core chat/session components: WebSocket client, message streaming, tool call display, session state
- [x] 1.3 Scaffold new SolidJS + Vite + Tailwind project in `src/` with bun toolchain
- [x] 1.4 Configure `package.json` with dependencies (`solid-js`, `@solidjs/router`, `@tanstack/solid-query`, `@kobalte/core`, `tailwindcss`, `vite`, `@solid-primitives/websocket`, `@solid-primitives/storage`, `shiki`, `marked`)
- [x] 1.5 Configure `vite.config.ts` for development (proxy to backend, iframe sandbox setup)
- [x] 1.6 Configure `tailwind.config.ts` with open-report design tokens
- [x] 1.7 Set up TypeScript strict config in `tsconfig.json`

## 2. Backend Server

- [x] 2.1 Create thin Bun HTTP server (`server/`) handling REST API endpoints
- [x] 2.2 Implement SQLite schema and migrations using `bun:sqlite` or `drizzle-orm`
- [x] 2.3 Implement project CRUD endpoints (`GET/POST/PUT/DELETE /api/projects`)
- [x] 2.4 Implement report CRUD endpoints (`GET/POST/DELETE /api/projects/:id/reports`) scoped to project
- [x] 2.5 Implement template CRUD endpoints (`GET/POST/PUT/DELETE /api/templates`)
- [x] 2.6 Implement author profile endpoints (`GET/PUT /api/profile`)
- [x] 2.7 Implement settings endpoints (`GET/PUT /api/settings`)
- [x] 2.8 Implement `project.json` read/write service (project config, context, repos, materials)
- [x] 2.9 Implement project repo cloning service (clone linked GitHub repos to `/tmp/opencode/<project>/`)
- [x] 2.10 Implement file watcher on `~/.open-report/<project>/` directory using `chokidar` for live preview notifications
- [x] 2.11 Implement Git operations service (init, commit, tag, log, checkout) — one git repo per project
- [x] 2.12 Implement opencode serve lifecycle management (spawn, health check, shutdown)
- [x] 2.13 Implement static file server for report output (serving HTML/diagrams to iframe)

## 3. Core UI Layout

- [x] 3.1 Build App shell component with three-panel resizable layout
- [x] 3.2 Build TopToolbar component (Export, Import, New Report, Help, Settings buttons)
- [x] 3.3 Build NavSidebar component (collapsible, icon+label mode, tree: Projects > Reports, Templates, Settings)
- [x] 3.4 Implement panel resize: draggable dividers between nav-chat and chat-preview
- [x] 3.5 Implement sidebar collapse/expand with animation
- [x] 3.6 Implement dark/light theme toggle with CSS custom properties
- [x] 3.7 Implement responsive layout breakpoints for smaller screens

## 4. Chat Interface

- [x] 4.1 Build ChatPanel container component
- [x] 4.2 Build SessionHeader (session name, status indicator, model info, close button)
- [x] 4.3 Build MessageList with virtual scrolling for large histories
- [x] 4.4 Build message types: UserMessage, AssistantMessage (streaming), ToolCallCard, ToolResultCard
- [x] 4.5 Implement WebSocket connection to opencode serve with reconnection logic
- [x] 4.6 Implement message streaming with incremental rendering
- [x] 4.7 Implement tool call display (collapsible cards with syntax-highlighted args/results)
- [x] 4.8 Build MessageInput with file attachment, prompt templates, and send button
- [x] 4.9 Build ChatToolbar (clear, export as markdown, session actions)
- [x] 4.10 Build SessionList (sidebar entries for active sessions, switch/resume)
- [x] 4.11 Implement session persistence: store session IDs in SQLite, reload history on reconnect

## 5. Report Preview Panel

- [x] 5.1 Build PreviewPanel container component
- [x] 5.2 Build HtmlPreview component with sandboxed iframe
- [x] 5.3 Implement artifact navigation (dropdown/tabs switching between report artifacts)
- [x] 5.4 Implement live reload via file watcher → iframe refresh
- [x] 5.5 Build DiagramEditor component (inline source editor + live preview pane)
- [x] 5.6 Implement diagram source loading from disk (.puml, .mmd, .py files)
- [x] 5.7 Implement diagram re-render via diagram-renderer subagent
- [x] 5.8 Implement "Edit with AI" context menu on diagram elements
- [x] 5.9 Build HtmlInspector component (element outline on hover, tag/class tooltip)
- [x] 5.10 Implement contentEditable on text element click
- [x] 5.11 Implement Shift+Click multi-select with visual highlight
- [x] 5.12 Implement "Send to AI" action for selected HTML elements

## 6. Report Management

- [x] 6.1 Build ReportList component in NavSidebar
- [x] 6.2 Implement report listing from SQLite metadata (sorted by last modified)
- [x] 6.3 Implement report search/filter input
- [x] 6.4 Implement report creation flow (calls guided init or quick start)
- [x] 6.5 Implement report open: load preview + create/resume opencode session
- [x] 6.6 Implement report delete with confirmation dialog
- [x] 6.7 Implement report export as ZIP (all artifacts)
- [x] 6.8 Implement report export as single HTML (inline images, self-contained)
- [x] 6.9 Implement import report from ZIP
- [x] 6.10 Implement Git auto-commit on render completion
- [x] 6.11 Implement Git tag on each version (`report/<id>/v<N>`)
- [x] 6.12 Build VersionHistory component (timeline of versions with commit messages)
- [x] 6.13 Implement version checkout/restore

## 7. Project Management

- [x] 7.1 Build ProjectList tree component in NavSidebar (expandable, reports as children)
- [x] 7.2 Implement project listing from SQLite metadata (sorted by last activity)
- [x] 7.3 Implement project creation wizard (name, description, context markdown, repos, materials)
- [x] 7.4 Implement `project.json` config editor: context (markdown), linked repos (GitHub URL + name), materials (file upload or path reference)
- [x] 7.5 Implement project open: expand tree, show reports, initialize git repo if missing
- [x] 7.6 Implement project delete with confirmation (removes `~/.open-report/<project>/`)
- [x] 7.7 Implement project archive (hide from list, keep data, recoverable)
- [x] 7.8 Implement repo cloning: clone linked GitHub repos into `/tmp/opencode/<project>/` for agent access
- [x] 7.9 Implement material upload: PDF, markdown, images stored in `~/.open-report/<project>/materials/`
- [x] 7.10 Implement project context injection into opencode session system prompt on session start

## 8. Template Management

- [x] 8.1 Build TemplateList component in NavSidebar
- [x] 8.2 Build TemplateDetail component (name, description, skills list, rules list, subagents config)
- [x] 8.3 Build skill selector: multi-select from available skills in `./skills/` and `.opencode/skills/`
- [x] 8.4 Build rule selector: multi-select from available rules in `rules/`
- [x] 8.5 Build subagent config editor: model overrides per agent type
- [x] 8.6 Implement template CRUD in SQLite
- [x] 8.7 Implement "Save as Template" from existing report
- [x] 8.8 Implement template application when creating new report (skills loaded, rules applied)

## 9. Author Profile

- [x] 9.1 Build SettingsPanel component in NavSidebar
- [x] 9.2 Build AuthorProfileForm (name, email, org, avatar URL fields)
- [x] 9.3 Implement profile persistence to `~/.open-report/config.json` and SQLite
- [x] 9.4 Implement first-launch profile prompt (modal or inline)
- [x] 9.5 Implement auto-fill of author metadata on new report creation
- [x] 9.6 Implement theme preference persistence
- [x] 9.7 Implement layout preference persistence (panel sizes, collapse state)

## 10. Guided Initialization

- [x] 10.1 Build InitWizard component (modal or embedded in chat panel)
- [x] 10.2 Implement chat-driven question flow: project → report type → target project → scope → review
- [x] 10.3 Implement AI question generation via opencode session (system prompt for wizard mode)
- [x] 10.4 Implement project selection (existing or create new) as first wizard step
- [x] 10.5 Implement report type selection (SRS, Architecture, Slides, Custom) with recommendations
- [x] 10.6 Implement target project input (git URL, local path, skip) — auto-fills from project repos if available
- [x] 10.7 Implement scope/sections configuration
- [x] 10.8 Implement wizard completion: create project (if new), output dir, openspec change, apply template
- [x] 10.9 Implement quick start bypass (title + project only, defaults for everything else)
- [x] 10.10 Implement wizard state persistence for interrupted sessions

## 11. Skill Packaging

- [x] 11.1 Create `./skills/` directory at project root
- [x] 11.2 Restructure existing `.opencode/skills/writing-srs/` → `./skills/open-report-writing-srs/`
- [x] 11.3 Restructure `.opencode/skills/open-report/` → `./skills/open-report-core/`
- [x] 11.4 Create `./skills/open-report-render-mermaid/` skill
- [x] 11.5 Create `./skills/open-report-render-plantuml/` skill
- [x] 11.6 Create `./skills/open-report-render-charts/` skill
- [x] 11.7 Create `./skills/open-report-assemble/` skill
- [x] 11.8 Create `./skills/open-report-validate/` skill
- [x] 11.9 Update `.opencode/opencode.json` to load skills from `[".opencode/skills", "./skills"]`
- [x] 11.10 Write migration script to help users migrate skills to open-report naming

## 12. GitBook Documentation

- [x] 12.1 Create GitBook project scaffold (separate repo or docs/ subdirectory for GitBook sync)
- [x] 12.2 Create auto-sync script (`scripts/sync-gitbook.ts` or `.sh`) that extracts docs from skills and rules
- [x] 12.3 Configure GitBook `SUMMARY.md` generation from available skills
- [x] 12.4 Add openspec post-archive hook to trigger GitBook sync
- [x] 12.5 Generate initial documentation: skill references, usage guides, workflow examples

## 13. Integration & Polish

- [x] 13.1 Integrate all panels into unified App shell
- [x] 13.2 Implement keyboard shortcuts (Ctrl+N new report, Ctrl+Enter send, Ctrl+S save, Escape close panel)
- [x] 13.3 Add loading states and error boundaries for all async operations
- [x] 13.4 Add toast notifications for actions (project created, report created, render complete, export done)
- [x] 13.5 Implement error handling: opencode serve unavailable, git not found, file permission errors
- [x] 13.6 Add graceful degradation when optional features unavailable (no git → skip versioning)
- [x] 13.7 Write E2E tests with Playwright covering core flows
- [x] 13.8 Write unit tests for backend services (SQLite, Git, file watcher)
- [x] 13.9 Performance optimization: lazy loading panels, virtual scroll in chat, diagram cache
- [x] 13.10 Accessibility audit: keyboard navigation, ARIA labels, focus management
- [x] 13.11 Create CONTEXT.md at project root with domain glossary
- [x] 13.12 Update README.md with UI setup and usage instructions
