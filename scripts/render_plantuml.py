#!/usr/bin/env python3
"""Render PlantUML diagrams (use case, component, etc.) to SVG/PNG."""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request


PLANTUML_JAR = os.path.expanduser("~/.local/share/open-report/plantuml.jar")
PLANTUML_DOWNLOAD_URL = (
    "https://github.com/plantuml/plantuml/releases/download/v1.2024.8/"
    "plantuml-1.2024.8.jar"
)


def ensure_plantuml() -> str:
    """Ensure plantuml.jar is available, download if not."""
    if os.path.exists(PLANTUML_JAR):
        return PLANTUML_JAR

    os.makedirs(os.path.dirname(PLANTUML_JAR), exist_ok=True)
    print(f"Downloading PlantUML JAR to {PLANTUML_JAR}...", file=sys.stderr)
    urllib.request.urlretrieve(PLANTUML_DOWNLOAD_URL, PLANTUML_JAR)
    return PLANTUML_JAR


def render_plantuml(diagram_source: str, output_path: str, diagram_type: str,
                    output_format: str = "svg") -> dict:
    """Render a PlantUML diagram and return result info."""

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    jar_path = ensure_plantuml()

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".puml", delete=False
    ) as f:
        f.write(diagram_source)
        puml_path = f.name

    try:
        output_dir = os.path.dirname(output_path) or "."
        output_name = os.path.splitext(os.path.basename(output_path))[0]

        fmt_flag = "-tsvg" if output_format == "svg" else "-tpng"

        cmd = [
            "java", "-jar", jar_path,
            fmt_flag,
            "-output", os.path.abspath(output_dir),
            os.path.abspath(puml_path),
        ]

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=60
        )

        generated_file = os.path.join(
            output_dir,
            os.path.basename(puml_path).replace(".puml", f".{output_format}")
        )

        if result.returncode != 0:
            return {
                "path": output_path,
                "type": "plantuml",
                "subtype": diagram_type,
                "format": output_format,
                "success": False,
                "error": result.stderr.strip(),
            }

        if generated_file != output_path and os.path.exists(generated_file):
            os.rename(generated_file, output_path)

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return {
                "path": output_path,
                "type": "plantuml",
                "subtype": diagram_type,
                "format": output_format,
                "success": False,
                "error": "Output file empty or not created",
            }

        return {
            "path": output_path,
            "type": "plantuml",
            "subtype": diagram_type,
            "format": output_format,
            "success": True,
            "size_bytes": os.path.getsize(output_path),
        }

    except FileNotFoundError:
        return {
            "path": output_path,
            "type": "plantuml",
            "subtype": diagram_type,
            "format": output_format,
            "success": False,
            "error": "Java not found. Install Java runtime (JRE >= 8).",
        }
    finally:
        os.unlink(puml_path)


def main():
    parser = argparse.ArgumentParser(description="Render PlantUML diagram")
    parser.add_argument("--source", required=True, help="PlantUML source (@startuml ... @enduml)")
    parser.add_argument("--type", required=True,
                        choices=["usecase", "component", "deployment", "sequence", "class"])
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--format", default="svg", choices=["svg", "png"])

    args = parser.parse_args()

    try:
        result = render_plantuml(args.source, args.output, args.type, args.format)
        print(json.dumps(result, indent=2))
        if not result["success"]:
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
