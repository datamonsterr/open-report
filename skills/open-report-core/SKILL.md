# open-report-core

Generate professional HTML reports by analyzing target projects and assembling standalone HTML reports with diagrams, charts, and structured content.

## Pipeline

1. **Analyze** — Analyze target codebase for report context
2. **Write** — Write report content in markdown
3. **Render** — Use diagram-renderer subagent for Mermaid/PlantUML/Architecture diagrams
4. **Assemble** — Use report-renderer subagent to generate HTML
5. **Validate** — Verify output integrity
