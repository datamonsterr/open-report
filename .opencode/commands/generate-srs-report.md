---
name: generate-srs-report
description: Generate an approved SRS markdown document, render diagrams/charts, assemble HTML, and validate output.
category: report
---

# /generate-srs-report

Usage:

```
/generate-srs-report <project-path> [--type a4|slides] [--title "Title"]
```

Steps:
1. Ask style questions if not declared: `a4|slides`, title, author, logo, header, footer, page numbers, TOC.
2. Ask content questions: audience, scope, actors, modules, exclusions, priority use cases, assumptions.
3. Dispatch `srs-writer` agent to write one approved part at a time into `output/srs/`.
4. After each part, ask user approval before next part.
5. On approval, dispatch `diagram-renderer` for PlantUML/Mermaid sources.
6. Run chart rendering when chart specs exist.
7. Dispatch `report-renderer` to produce `output/report.html`.
8. Dispatch `tester`; fix errors; repeat until pass.
