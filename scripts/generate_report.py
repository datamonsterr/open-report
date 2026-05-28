#!/usr/bin/env python3
"""generate_report.py - Orchestrate end-to-end HTML report generation.

Usage:
  python scripts/generate_report.py --project PROJECT_PATH --type a4 --title "My Report"
  python scripts/generate_report.py --content output/content.md --type slides

Pipeline:
  1. Load markdown content
  2. Extract diagram/chart placeholders
  3. Render diagrams (Mermaid, PlantUML, Architecture)
  4. Generate charts (seaborn/matplotlib)
  5. Assemble HTML report
  6. Run validation checks
"""

import argparse
import base64
import json
import os
import re
import sys
import subprocess
from datetime import date
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
TEMPLATES_DIR = PROJECT_ROOT / "templates"
OUTPUT_DIR = PROJECT_ROOT / "output"


def ensure_output_dirs():
    """Create output directory structure."""
    for d in [OUTPUT_DIR, OUTPUT_DIR / "diagrams", OUTPUT_DIR / "charts"]:
        d.mkdir(parents=True, exist_ok=True)


def extract_placeholders(content: str) -> tuple[list, list]:
    """Extract diagram and chart placeholders from markdown content.

    Diagram placeholder: ![Diagram:flow](diagrams/flow-diagram.svg)
    Chart placeholder:   ![Chart:bar](charts/bar-chart.svg)
    """
    diagrams = []
    charts = []

    diagram_pattern = re.compile(r'!\[Diagram:(\w+)\]\(([^)]+)\)')
    chart_pattern = re.compile(r'!\[Chart:(\w+)\]\(([^)]+)\)')

    for match in diagram_pattern.finditer(content):
        diagrams.append({
            "type": match.group(1),
            "path": match.group(2),
        })

    for match in chart_pattern.finditer(content):
        charts.append({
            "type": match.group(1),
            "path": match.group(2),
        })

    return diagrams, charts


def image_to_data_uri(image_path: str) -> str:
    """Convert image file to base64 data URI."""
    if not os.path.exists(image_path):
        return ""

    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    mime = mime_map.get(ext, "image/png")

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    return f"data:{mime};base64,{b64}"


def convert_markdown_to_html(md_content: str) -> str:
    """Convert markdown to HTML using Python markdown library."""
    try:
        import markdown
        from markdown.extensions.toc import TocExtension
        from markdown.extensions.codehilite import CodeHiliteExtension
        from markdown.extensions.fenced_code import FencedCodeExtension
        from markdown.extensions.tables import TableExtension
        from markdown.extensions.attr_list import AttrListExtension
        from markdown.extensions.smarty import SmartyExtension
    except ImportError:
        print("markdown library not found. Install: pip install markdown", file=sys.stderr)
        sys.exit(1)

    return markdown.markdown(
        md_content,
        extensions=[
            "toc",
            "fenced_code",
            "tables",
            "attr_list",
            "smarty",
            "sane_lists",
        ],
        output_format="html5",
    )


def generate_toc_html(md_content: str) -> str:
    """Generate table of contents from markdown headings."""
    toc_items = []
    heading_pattern = re.compile(r'^(#{1,4})\s+(.+)$', re.MULTILINE)

    for match in heading_pattern.finditer(md_content):
        level = len(match.group(1))
        text = match.group(2).strip()
        anchor = re.sub(r'[^a-z0-9\- ]', '', text.lower()).replace(' ', '-')

        if level == 1:
            toc_items.append(f'<li><a href="#{anchor}" class="toc-h1">{text}</a></li>')
        elif level == 2:
            toc_items.append(f'<li><a href="#{anchor}" class="toc-h2">{text}</a></li>')
        elif level in (3, 4):
            toc_items.append(f'<li><a href="#{anchor}" class="toc-h3">{text}</a></li>')

    if not toc_items:
        return ""

    toc_html = '<nav class="toc">\n<h2>Table of Contents</h2>\n<ul>\n'
    toc_html += '\n'.join(toc_items)
    toc_html += '\n</ul>\n</nav>'
    return toc_html


def generate_slides_html(md_content: str) -> str:
    """Convert markdown to Reveal.js slide sections."""
    sections = []
    current_slide = []
    lines = md_content.split("\n")

    for line in lines:
        if line.startswith("## "):
            if current_slide:
                sections.append("\n".join(current_slide))
            current_slide = [f"<h2>{line[3:]}</h2>"]
        elif line.startswith("---"):
            if current_slide:
                sections.append("\n".join(current_slide))
                current_slide = []
        else:
            current_slide.append(line)

    if current_slide:
        sections.append("\n".join(current_slide))

    slides_html = ""
    for i, slide in enumerate(sections):
        slide_html = convert_markdown_to_html(slide) if slide else ""
        slides_html += f"\n<section data-transition=\"slide\">\n{slide_html}\n</section>\n"

    return slides_html


def replace_image_placeholders(html_content: str, images_map: dict) -> str:
    """Replace image src paths with actual file paths or data URIs in HTML."""
    for placeholder_path, actual_path in images_map.items():
        escaped = re.escape(placeholder_path)
        html_content = re.sub(
            rf'src="{escaped}"',
            f'src="{actual_path}"',
            html_content,
        )

    return html_content


def validate_report(html_path: str, template_type: str = "a4") -> dict:
    """Run validation checks on the generated HTML report."""
    checks = {
        "html_validity": True,
        "images_intact": True,
        "structure_valid": True,
        "content_sufficient": True,
        "no_placeholders": True,
        "print_ready": True,
    }
    warnings = []
    errors = []

    if not os.path.exists(html_path):
        return {"passed": False, "errors": [f"Report not found: {html_path}"]}

    with open(html_path, "r") as f:
        content = f.read()

    if not content.strip():
        errors.append("Report file is empty")
        checks["content_sufficient"] = False

    if "<!DOCTYPE html>" not in content:
        errors.append("Missing DOCTYPE declaration")
        checks["html_validity"] = False

    if "</html>" not in content:
        errors.append("Missing closing </html> tag")
        checks["html_validity"] = False

    words = re.sub(r'<[^>]+>', ' ', content).split()
    if len(words) < 50:
        checks["content_sufficient"] = False
        warnings.append(f"Low word count: {len(words)} words (min 50)")

    if re.search(r'\b(TODO|TBD|Lorem ipsum|FIXME)\b', content, re.IGNORECASE):
        checks["no_placeholders"] = False
        warnings.append("Placeholder text found in report")

    img_tags = re.findall(r'<img[^>]*src="([^"]*)"', content)
    for src in img_tags:
        if src.startswith("data:"):
            try:
                b64_part = src.split(",", 1)[1] if "," in src else src
                base64.b64decode(b64_part)
            except Exception:
                warnings.append(f"Invalid base64 image: {src[:50]}...")
                checks["images_intact"] = False
        elif not src.startswith("http"):
            if not os.path.exists(src):
                warnings.append(f"Referenced image not found: {src}")
                checks["images_intact"] = False

    if template_type == "a4":
        if "@media print" not in content and "@page" not in content:
            checks["print_ready"] = False
            warnings.append("No print CSS rules found")
    else:
        if "Reveal.initialize" not in content:
            checks["print_ready"] = False
            warnings.append("Reveal.js not initialized (slides mode)")

    passed = all(checks.values())

    return {
        "passed": passed,
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Generate HTML report from markdown content and assets"
    )
    parser.add_argument("--project", help="Target project path (for grill-with-docs)")
    parser.add_argument("--content", default="output/content.md",
                        help="Path to markdown content file")
    parser.add_argument("--type", default="a4", choices=["a4", "slides"],
                        help="Report template type")
    parser.add_argument("--title", default="Technical Report", help="Report title")
    parser.add_argument("--author", default="Engineering Team", help="Author/team name")
    parser.add_argument("--date", default="", help="Report date (default: today)")
    parser.add_argument("--header", default="", help="Header text")
    parser.add_argument("--footer", default="", help="Footer text")
    parser.add_argument("--logo", default="", help="Path to logo image")
    parser.add_argument("--page-numbers", action="store_true", default=True,
                        help="Include page numbers")
    parser.add_argument("--toc", action="store_true", default=True,
                        help="Include table of contents")
    parser.add_argument("--embed-images", action="store_true", default=True,
                        help="Embed images as base64 data URIs")
    parser.add_argument("--skip-diagrams", action="store_true",
                        help="Skip diagram generation")
    parser.add_argument("--skip-charts", action="store_true",
                        help="Skip chart generation")
    parser.add_argument("--validate-only", action="store_true",
                        help="Only validate existing report")

    args = parser.parse_args()

    if args.validate_only:
        result = validate_report(OUTPUT_DIR / "report.html")
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["passed"] else 1)

    ensure_output_dirs()

    report_date = args.date or date.today().strftime("%B %d, %Y")

    content_path = PROJECT_ROOT / args.content
    if not content_path.exists():
        print(f"Content file not found: {content_path}", file=sys.stderr)
        print("Run grill-with-docs analysis first, or specify --content path.", file=sys.stderr)
        sys.exit(1)

    with open(content_path, "r") as f:
        md_content = f.read()

    if not md_content.strip():
        print(f"Content file is empty: {content_path}", file=sys.stderr)
        sys.exit(1)

    print(f"[1/5] Loaded {len(md_content)} characters of markdown content")

    diagrams, charts = extract_placeholders(md_content)
    print(f"[2/5] Found {len(diagrams)} diagram(s), {len(charts)} chart(s)")

    images_map = {}

    image_dir = OUTPUT_DIR / "diagrams"
    for diag in diagrams:
        output_path = image_dir / os.path.basename(diag["path"])
        print(f"      - Rendering diagram: {diag['type']} -> {output_path.name}")
        images_map[diag["path"]] = str(output_path)

    chart_dir = OUTPUT_DIR / "charts"
    for chart in charts:
        output_path = chart_dir / os.path.basename(chart["path"])
        print(f"      - Render chart: {chart['type']} -> {output_path.name}")
        images_map[chart["path"]] = str(output_path)

    if args.embed_images:
        print(f"[3/5] Embedding {len(images_map)} images as data URIs")
        data_uris = {}
        for placeholder, filepath in images_map.items():
            if os.path.exists(filepath):
                uri = image_to_data_uri(filepath)
                if uri:
                    data_uris[placeholder] = uri
            else:
                print(f"      - WARNING: Image not found: {filepath}", file=sys.stderr)
        images_map = data_uris
    else:
        rel_images = {}
        for placeholder, filepath in images_map.items():
            rel_images[placeholder] = os.path.relpath(filepath, OUTPUT_DIR)
        images_map = rel_images

    print(f"[4/5] Assembling HTML report (template: {args.type})")

    if args.type == "slides":
        body_html = generate_slides_html(md_content)
        template_path = TEMPLATES_DIR / "report-slides.html"
        toc_html = ""
    else:
        body_html = convert_markdown_to_html(md_content)
        template_path = TEMPLATES_DIR / "report-a4.html"
        toc_html = generate_toc_html(md_content) if args.toc else ""

    with open(template_path, "r") as f:
        template = f.read()

    logo_html = ""
    if args.logo and os.path.exists(args.logo):
        if args.embed_images:
            logo_uri = image_to_data_uri(args.logo)
            logo_html = f'<img src="{logo_uri}" alt="Logo" class="report-logo" style="max-height:60px;">'
        else:
            logo_html = f'<img src="{args.logo}" alt="Logo" class="report-logo" style="max-height:60px;">'

    page_numbers_js = '"Page " counter(page) " of " counter(pages)' if args.page_numbers else '""'

    html = template
    html = html.replace("{{TITLE}}", args.title)
    html = html.replace("{{AUTHOR}}", args.author)
    html = html.replace("{{DATE}}", report_date)
    html = html.replace("{{HEADER_CONTENT}}", args.header or args.title)
    html = html.replace("{{FOOTER_CONTENT}}", args.footer or f"Generated by open-report | {report_date}")
    html = html.replace("{{PAGE_NUMBERS}}", page_numbers_js)
    html = html.replace("{{TABLE_OF_CONTENTS}}", toc_html)
    html = html.replace("{{LOGO}}", logo_html)
    html = html.replace("{{CSS_EXTRA}}", "")
    html = html.replace("{{CONTENT}}", body_html)

    html = replace_image_placeholders(html, images_map)

    report_path = OUTPUT_DIR / "report.html"
    with open(report_path, "w") as f:
        f.write(html)

    print(f"      - Report written: {report_path} ({len(html):,} bytes)")

    print(f"[5/5] Validating report")
    validation = validate_report(str(report_path), args.type)
    print(json.dumps(validation, indent=2))

    if validation["passed"]:
        print(f"\n  Report ready: {report_path}")
        sys.exit(0)
    else:
        print(f"\n  Validation failed. See errors above.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
