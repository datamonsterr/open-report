#!/usr/bin/env python3
"""Render high-level architecture diagrams using the Python `diagrams` library."""

import argparse
import json
import os
import subprocess
import sys
import tempfile


def render_architecture_diagram(python_source: str, output_path: str,
                                output_format: str = "svg") -> dict:
    """Execute Python diagrams code and return result info."""

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    if not python_source.strip().startswith("from diagrams"):
        report(
            None, "diagrams", "architecture", output_format, output_path,
            success=False,
            error="Source must start with 'from diagrams import ...'"
        )
        return locals().get("_last_result", {})

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False
    ) as f:
        f.write(python_source)
        py_path = f.name

    try:
        result = subprocess.run(
            [sys.executable, py_path],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "DIAGRAMS_OUTPUT": output_path},
        )

        if result.returncode != 0:
            return {
                "path": output_path,
                "type": "diagrams",
                "subtype": "architecture",
                "format": output_format,
                "success": False,
                "error": result.stderr.strip() or result.stdout.strip(),
            }

        output_dir = os.path.dirname(output_path) or "."
        output_base = os.path.splitext(os.path.basename(output_path))[0]

        possible_paths = [
            output_path,
            os.path.join(output_dir, f"{output_base}.{output_format}"),
            f"{output_base}.{output_format}",
        ]

        found = None
        for p in possible_paths:
            if os.path.exists(p) and os.path.getsize(p) > 0:
                found = p
                break

        if not found:
            list_dir = os.listdir(output_dir) if os.path.exists(output_dir) else []
            matching = [f for f in list_dir if output_base in f
                        and f.endswith(f".{output_format}")]
            if matching:
                found = os.path.join(output_dir, matching[0])

        if found and found != output_path:
            os.rename(found, output_path)
            found = output_path

        if not found:
            return {
                "path": output_path,
                "type": "diagrams",
                "subtype": "architecture",
                "format": output_format,
                "success": False,
                "error": f"Output file not found. Expected at {output_path}",
            }

        return {
            "path": output_path,
            "type": "diagrams",
            "subtype": "architecture",
            "format": output_format,
            "success": True,
            "size_bytes": os.path.getsize(output_path),
        }

    except Exception as e:
        return {
            "path": output_path,
            "type": "diagrams",
            "subtype": "architecture",
            "format": output_format,
            "success": False,
            "error": str(e),
        }
    finally:
        os.unlink(py_path)


def main():
    parser = argparse.ArgumentParser(
        description="Render architecture diagram using Python diagrams library"
    )
    parser.add_argument("--source", required=True,
                        help="Python source code using diagrams library")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--format", default="svg", choices=["svg", "png"])

    args = parser.parse_args()

    try:
        result = render_architecture_diagram(args.source, args.output, args.format)
        print(json.dumps(result, indent=2))
        if not result["success"]:
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
