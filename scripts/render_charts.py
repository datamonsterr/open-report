#!/usr/bin/env python3
"""Generate charts using seaborn and matplotlib, render to SVG/PNG for HTML reports."""

import argparse
import json
import os
import sys


def generate_bar_chart(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a bar chart."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style=config.get("style", "whitegrid"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (10, 6)))

    data = config["data"]
    labels = data.get("labels", [])
    values = data.get("values", [])

    bars = ax.bar(
        labels, values,
        color=config.get("color", sns.color_palette("viridis", len(labels))),
        edgecolor=config.get("edgecolor", "white"),
    )

    for bar in bars:
        height = bar.get_height()
        ax.annotate(
            f"{height:.1f}" if isinstance(height, float) else str(height),
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 3),
            textcoords="offset points",
            ha="center", va="bottom", fontsize=9,
        )

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    ax.set_xlabel(config.get("xlabel", ""), fontsize=11)
    ax.set_ylabel(config.get("ylabel", ""), fontsize=11)
    plt.xticks(rotation=config.get("rotation", 0), ha="right" if config.get("rotation", 0) else "center")
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "bar",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


def generate_line_chart(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a line chart."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style=config.get("style", "whitegrid"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (10, 6)))

    data = config["data"]
    for series in data.get("series", []):
        ax.plot(
            series.get("x", []),
            series.get("y", []),
            label=series.get("label", ""),
            marker=series.get("marker", "o"),
            linewidth=series.get("linewidth", 2),
            markersize=series.get("markersize", 4),
        )

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    ax.set_xlabel(config.get("xlabel", ""), fontsize=11)
    ax.set_ylabel(config.get("ylabel", ""), fontsize=11)
    if data.get("series") and any(s.get("label") for s in data["series"]):
        ax.legend(loc="best")
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "line",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


def generate_pie_chart(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a pie/donut chart."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style=config.get("style", "whitegrid"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (8, 8)))

    data = config["data"]
    values = data.get("values", [])
    labels = data.get("labels", [])
    colors = config.get("colors", sns.color_palette("pastel", len(values)))

    wedges, texts, autotexts = ax.pie(
        values,
        labels=labels,
        autopct=config.get("autopct", "%1.1f%%"),
        colors=colors,
        startangle=config.get("startangle", 90),
        pctdistance=config.get("pctdistance", 0.75),
    )

    if config.get("donut", False):
        centre_circle = plt.Circle((0, 0), 0.60, fc="white")
        ax.add_artist(centre_circle)

    for autotext in autotexts:
        autotext.set_fontsize(9)

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "pie",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


def generate_heatmap(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a heatmap."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    import numpy as np

    sns.set_theme(style=config.get("style", "white"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (10, 8)))

    data = config["data"]
    matrix = np.array(data.get("matrix", []))
    labels_x = data.get("labels_x", [])
    labels_y = data.get("labels_y", [])

    hm = sns.heatmap(
        matrix,
        annot=config.get("annot", True),
        fmt=config.get("fmt", ".2g"),
        cmap=config.get("cmap", "YlOrRd"),
        xticklabels=labels_x,
        yticklabels=labels_y,
        ax=ax,
        cbar_kws={"label": config.get("cbar_label", "")},
    )

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    ax.set_xlabel(config.get("xlabel", ""), fontsize=11)
    ax.set_ylabel(config.get("ylabel", ""), fontsize=11)
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "heatmap",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


def generate_scatter_plot(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a scatter plot."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style=config.get("style", "whitegrid"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (10, 6)))

    data = config["data"]
    for series in data.get("series", []):
        ax.scatter(
            series.get("x", []),
            series.get("y", []),
            label=series.get("label", ""),
            s=series.get("size", 40),
            alpha=series.get("alpha", 0.7),
        )

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    ax.set_xlabel(config.get("xlabel", ""), fontsize=11)
    ax.set_ylabel(config.get("ylabel", ""), fontsize=11)
    if data.get("series") and any(s.get("label") for s in data["series"]):
        ax.legend(loc="best")
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "scatter",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


def generate_box_plot(output_path: str, config: dict, output_format: str = "svg") -> dict:
    """Generate a box plot."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style=config.get("style", "whitegrid"))
    fig, ax = plt.subplots(figsize=config.get("figsize", (10, 6)))

    data = config["data"]
    dataset = data.get("dataset", [])
    labels = data.get("labels", [])

    bp = ax.boxplot(
        dataset,
        labels=labels,
        patch_artist=config.get("patch_artist", True),
        showmeans=config.get("showmeans", True),
    )

    ax.set_title(config.get("title", ""), fontsize=14, fontweight="bold")
    ax.set_xlabel(config.get("xlabel", ""), fontsize=11)
    ax.set_ylabel(config.get("ylabel", ""), fontsize=11)
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fig.savefig(output_path, format=output_format, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return {
        "path": output_path,
        "type": "chart",
        "subtype": "box",
        "format": output_format,
        "success": True,
        "size_bytes": os.path.getsize(output_path),
    }


CHART_GENERATORS = {
    "bar": generate_bar_chart,
    "line": generate_line_chart,
    "pie": generate_pie_chart,
    "heatmap": generate_heatmap,
    "scatter": generate_scatter_plot,
    "box": generate_box_plot,
}


def render_chart(chart_type: str, output_path: str, config: dict,
                 output_format: str = "svg") -> dict:
    """Render a chart of the given type."""
    if chart_type not in CHART_GENERATORS:
        return {
            "path": output_path,
            "type": "chart",
            "subtype": chart_type,
            "format": output_format,
            "success": False,
            "error": f"Unknown chart type: {chart_type}. "
                     f"Supported: {list(CHART_GENERATORS.keys())}",
        }

    try:
        return CHART_GENERATORS[chart_type](output_path, config, output_format)
    except Exception as e:
        return {
            "path": output_path,
            "type": "chart",
            "subtype": chart_type,
            "format": output_format,
            "success": False,
            "error": str(e),
        }


def main():
    parser = argparse.ArgumentParser(description="Generate charts for reports")
    parser.add_argument("--type", required=True,
                        choices=list(CHART_GENERATORS.keys()))
    parser.add_argument("--config", required=True,
                        help="JSON config for the chart")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--format", default="svg", choices=["svg", "png"])

    args = parser.parse_args()

    try:
        config = json.loads(args.config)
        result = render_chart(args.type, args.output, config, args.format)
        print(json.dumps(result, indent=2))
        if not result["success"]:
            sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON config: {e}"}, indent=2))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
