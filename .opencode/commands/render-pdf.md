---
name: render-pdf
description: Render an HTML report to PDF with A4 portrait + landscape for wide diagrams
category: report
---

# render-pdf

Render an HTML report to a print-ready PDF.

## Usage

```
/render-pdf [input.html] [output.pdf]
```

## Options

| Flag | Effect |
|------|--------|
| (none) | Auto-detect `.diagram-container` elements, render them landscape; everything else portrait |
| `--landscape` | Force A4 landscape for all pages |
| `--no-landscape` | Force A4 portrait for all pages (diagrams scale to fit) |
| `--chromium PATH` | Specify Chromium executable path (default: auto-detect system chromium) |

## Examples

```
/render-pdf output/report.html
/render-pdf output/report.html output/arch-report.pdf
/render-pdf output/report.html --landscape
```

## Implementation

Runs `node scripts/render_pdf.js` with Chromium puppeteer. Injects CSS `@page` rules for portrait/landscape switching per diagram element. Fixes relative image paths to absolute `file://` URIs.

Requires: `puppeteer` (npm), Chromium browser.
