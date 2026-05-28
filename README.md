# open-report

Generate professional HTML reports from codebase analysis — SRS documents, architecture designs, system design docs.

## Architecture

```
target project → grill-with-docs → markdown → diagrams + charts → HTML report
                                                          ↑
                              Mermaid/PlantUML/Diagrams ───┤
                              seaborn/matplotlib ──────────┘
```

## Quick Start

```bash
# Setup
python -m venv .venv
.venv/bin/pip install -r requirements.txt

# Install system deps (optional, for full rendering)
# npm install -g @mermaid-js/mermaid-cli
# sudo pacman -S jre-openjdk graphviz

# Test pipeline
.venv/bin/python output/example_diagrams.py
.venv/bin/python scripts/generate_report.py --title "Test Report" --type a4

# Open result
open output/report.html
```

## Project Structure

```
.opencode/           # Opencode harness config
  commands/          # Slash commands
  subagents/         # Agent definitions
  skills/            # Project skills
scripts/             # Python utilities
  generate_report.py # Main orchestrator
  render_mermaid.py  # Mermaid → SVG
  render_plantuml.py # PlantUML → SVG
  render_architecture.py # Python diagrams → SVG
  render_charts.py   # seaborn/matplotlib → SVG
templates/           # HTML templates
  report-a4.html     # Paginated A4 report
  report-slides.html # Reveal.js slides
output/              # Generated files and sample content
requirements.txt     # Python dependencies
```

## Subagents

| Agent | Purpose |
|-------|---------|
| Diagram-Renderer | Mermaid, PlantUML, Architecture diagrams → SVG/PNG |
| Report-Renderer | Markdown + images → HTML report |
| Tester | Validate HTML output quality |

## Generate Report

```bash
# Full A4 report
.venv/bin/python scripts/generate_report.py \
  --content output/content.md \
  --type a4 \
  --title "System Architecture Report" \
  --author "Engineering Team" \
  --header "CONFIDENTIAL" \
  --toc

# Slides
.venv/bin/python scripts/generate_report.py \
  --content output/content.md \
  --type slides \
  --title "Architecture Overview"
```

## Markdown Content Format

Content supports image placeholders:

```markdown
![Diagram:flow](diagrams/flow-diagram.svg)
![Diagram:sequence](diagrams/sequence-diagram.svg)
![Diagram:class](diagrams/class-diagram.svg)
![Diagram:usecase](diagrams/usecase-diagram.svg)
![Diagram:architecture](diagrams/architecture-diagram.svg)
![Chart:bar](charts/bar-chart.svg)
![Chart:line](charts/line-chart.svg)
![Chart:pie](charts/pie-chart.svg)
```

Supports: `bar`, `line`, `pie`, `heatmap`, `scatter`, `box` chart types.
