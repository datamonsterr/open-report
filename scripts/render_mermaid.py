#!/usr/bin/env python3
"""Render Mermaid diagrams to SVG/PNG using mermaid-cli."""

import argparse
import json
import os
import subprocess
import sys
import tempfile


def render_mermaid(diagram_source: str, output_path: str, diagram_type: str,
                   output_format: str = "svg", theme: str = "neutral") -> dict:
    """Render a Mermaid diagram and return result info."""

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    source_lower = diagram_source.strip().lower()
    valid_mermaid = any(
        source_lower.startswith(prefix) for prefix in [
            "graph ", "flowchart ", "sequencediagram", "classDiagram",
            "stateDiagram", "erDiagram", "gantt", "pie ", "gitGraph",
            "mindmap", "timeline", "journey", "quadrantChart",
            "sequenceDiagram",
        ]
    )
    if not valid_mermaid:
        raise ValueError(
            f"Mermaid source must start with a valid diagram type keyword. "
            f"Got: {diagram_source[:60]}..."
        )

    if output_format not in ("svg", "png"):
        raise ValueError(f"Format must be 'svg' or 'png', got: {output_format}")

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".mmd", delete=False
    ) as f:
        f.write(diagram_source)
        mmd_path = f.name

    try:
        cmd = [
            "mmdc",
            "-i", mmd_path,
            "-o", output_path,
            "-t", theme,
        ]
        if output_format == "png":
            cmd.extend(["-b", "transparent", "-w", "1920", "-H", "1080"])

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=60
        )

        if result.returncode != 0:
            return {
                "path": output_path,
                "type": "mermaid",
                "subtype": diagram_type,
                "format": output_format,
                "success": False,
                "error": result.stderr.strip(),
            }

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return {
                "path": output_path,
                "type": "mermaid",
                "subtype": diagram_type,
                "format": output_format,
                "success": False,
                "error": "Output file empty or not created",
            }

        return {
            "path": output_path,
            "type": "mermaid",
            "subtype": diagram_type,
            "format": output_format,
            "success": True,
            "size_bytes": os.path.getsize(output_path),
        }

    except FileNotFoundError:
        return {
            "path": output_path,
            "type": "mermaid",
            "subtype": diagram_type,
            "format": output_format,
            "success": False,
            "error": "mmdc not found. Install: npm install -g @mermaid-js/mermaid-cli",
        }
    finally:
        os.unlink(mmd_path)


def main():
    parser = argparse.ArgumentParser(description="Render Mermaid diagram")
    parser.add_argument("--source", required=True, help="Mermaid diagram source")
    parser.add_argument("--type", required=True,
                        choices=["flow", "sequence", "class", "state", "er", "gantt"])
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--format", default="svg", choices=["svg", "png"])
    parser.add_argument("--theme", default="neutral",
                        choices=["default", "neutral", "dark", "forest"])

    args = parser.parse_args()

    try:
        result = render_mermaid(
            args.source, args.output, args.type, args.format, args.theme
        )
        print(json.dumps(result, indent=2))
        if not result["success"]:
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
