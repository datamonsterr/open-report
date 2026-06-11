# open-report

Generate professional HTML reports from codebase analysis — SRS documents, architecture designs, system design docs.

## Quick Start

```bash
# Install frontend deps
bun install

# Start backend server
bun run server

# Start frontend dev server (in another terminal)
bun run dev
```

Open http://localhost:5173 in your browser.

## UI Development

The web UI is a SolidJS + Vite + Tailwind app with:
- **Left sidebar**: Project tree, templates, settings
- **Chat panel**: OpenCode session integration
- **Right preview**: Live HTML report rendering with diagram editing

```bash
bun run dev        # Vite dev server (port 5173)
bun run server     # Backend API (port 4091)
bun run build      # Production build
bun run typecheck  # TypeScript check
```

## Skills

Custom skills in `./skills/` with `open-report-` prefix:

| Skill | Purpose |
|-------|---------|
| open-report-core | Main report generation pipeline |
| open-report-writing-srs | SRS document authoring |
| open-report-render-mermaid | Mermaid diagram rendering |
| open-report-render-plantuml | PlantUML diagram rendering |
| open-report-render-charts | Chart generation |
| open-report-assemble | HTML report assembly |
| open-report-validate | Report validation |

## GitBook Docs

```bash
bun run scripts/sync-gitbook.ts
```

Auto-generates documentation pages from skills and rules.
