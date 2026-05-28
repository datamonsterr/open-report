---
name: generate-report
description: Generate a complete HTML report from a target project. Runs grill-with-docs analysis, collects markdown content, renders diagrams and charts, assembles HTML report, and validates output.
category: report
---

# generate-report

Generate a professional HTML report for a given project or codebase.

## Usage

```
/generate-report [target-project-path] [--type slides|a4] [--title "Report Title"] [--content srs|architecture|design|api]
```

## Pipeline

### Phase 1: Analysis (grill-with-docs)
1. Load the `grill-with-docs` skill
2. Analyze the target project's codebase and requirements
3. Produce domain model refinement and terminology decisions
4. Write analysis to `output/analysis.md`
5. **WAIT for user approval** before proceeding

### Phase 2: Content Writing
1. Based on approved analysis, write report content in markdown
2. Content types supported:

| Content Type | Writer | Output |
|-------------|--------|--------|
| **SRS** (Software Requirements Specification) | `srs-writer` subagent + `writing-srs` skill | Use case specs with flow tables, UC diagram, sequence diagrams |
| **Architecture** (High-Level Architecture Design) | direct + `grill-with-docs` | Architecture diagrams, component design |
| **Design** (System Design Document) | direct | System design, data flow, class diagrams |
| **API** (API Documentation) | direct | Endpoint docs, request/response schemas |

#### SRS Content Type (special handling)
When `--content srs`:
1. Dispatch **srs-writer** subagent with `writing-srs` skill loaded
2. srs-writer identifies actors and use cases
3. For each use case: writes 13-field spec with main/alt flow **tables**
4. Generates PlantUML use case diagram with correct **include/extend** relationships
5. Generates Mermaid **sequence diagram for each use case** from flow table
6. Assembles all into `output/srs/srs-content.md`
7. Naming: `UC-{MODULE}-{SEQ}` format, consistent across spec + diagram + SD

3. Include diagram placeholders: `![Diagram:flow](diagrams/flow-diagram.svg)`
4. Include chart placeholders: `![Chart:bar](charts/bar-chart.svg)`
5. Write to `output/content.md`
6. **WAIT for user approval** before proceeding

### Phase 3: Diagram Rendering
1. Dispatch **Diagram-Renderer** subagent for each diagram:
   - Flow diagrams (Mermaid)
   - Sequence diagrams (Mermaid)
   - Class diagrams (Mermaid)
   - Use case diagrams (PlantUML)
   - Architecture diagrams (Python diagrams.mingrammer)
2. Collect all generated image paths

### Phase 4: Chart Generation
1. Execute `scripts/render_charts.py` with chart definitions
2. Generate seaborn/matplotlib charts as SVG/PNG
3. Collect all generated chart paths

### Phase 5: Report Assembly
1. Dispatch **Report-Renderer** subagent with:
   - Approved markdown content
   - All image references
   - Template selection (a4 or slides)
   - User's format preferences (header, footer, page numbers, TOC)
2. Generate standalone HTML report

### Phase 6: Validation
1. Dispatch **Tester** subagent on generated report
2. Fix any issues found
3. Confirm report is ready

## User Questions (asked during setup or generation)

When generating a report, ask the user:
1. **Report type**: Slides or A4 pages?
2. **Header/footer content**: What text to include?
3. **Page numbering**: Enabled?
4. **Table of contents**: Auto-generated?
5. **Logo**: Path to logo image?
6. **Author/team**: Attribution line?

## Output Structure

```
output/
  analysis.md              # grill-with-docs analysis
  content.md               # Approved markdown content
  diagrams/                # Generated diagram images
    flow-diagram.svg
    sequence-diagram.svg
    class-diagram.svg
    usecase-diagram.svg
    architecture-diagram.svg
  charts/                  # Generated chart images
    bar-chart.svg
    line-chart.svg
  srs/                     # SRS-specific output (when --content srs)
    srs-content.md         # Combined SRS document
    use-cases/             # Individual UC specs
      UC-AUTH-01-login.md
      UC-ORDER-01-place-order.md
    diagrams/              # UC and sequence diagrams
      usecase-diagram.svg
      sd-UC-AUTH-01.svg
      sd-UC-ORDER-01.svg
  report.html              # Final standalone HTML report
```

## Requirements

- Python 3.10+ with `markdown`, `diagrams`, `matplotlib`, `seaborn` packages
- `mermaid-cli` (npm package @mermaid-js/mermaid-cli)
- `plantuml` JAR (downloads automatically or use system package)
- `graphviz` (for Python diagrams library)
- `use-case-writer` skill (phucnt-bazone-vietnam) — installed via `npx skills add`
- `writing-srs` skill (project-local) — for SRS document generation
