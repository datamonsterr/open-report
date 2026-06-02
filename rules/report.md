# open-report Methodology

Scripts produce artifact images into a structured folder, writing metadata JSON describing each artifact. The agent then writes HTML/CSS directly using those images.

Build artifacts folder directly by running render scripts.

## Rendering
Only use scripts for generating diagram images, charts, or other image assets. All artifacts land under `output/<report>/<type>/`, e.g. `output/srs/diagrams/usecase-diagram.svg`.

After rendering, produce `output/<report>/artifacts.json` mapping artifact id to path, type, alt text, and layout hint.

```
{ "artifacts": [ { "id": "usecase", "path": "diagrams/usecase-diagram.svg", "type": "diagram:usecase", "alt": "Use Case Diagram", "layout": "full-width" } ] }
```

Scripts only build images; the agent writes the final report HTML/CSS directly, reading artifacts.json and sources to build the document UI.

Updated agents: diagram-renderer renders sources using scripts and writes artifacts.json; report-renderer reads artifacts.json and writes final HTML/CSS using only inline styles and semantic HTML, not interleaving Python/script invocation in the report assembly step.

## Mistakes

### Migration smoke test rules
- Context: Migration smoke tests and mistake capture workflows.
- Mistake: Installing mistake framework per project or storing reusable mistake rules outside project `rules/*.md`.
- Correct rule: Keep mistake framework installed globally; store reusable project rules in `rules/*.md`.
- Example fix: Move rule note into `rules/report.md`, `rules/srs.md`, `rules/db_schema.md`, or matching project rule file; leave global command/framework unchanged.
