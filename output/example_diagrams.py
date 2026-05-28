#!/usr/bin/env python3
"""example_diagrams.py - Generate example diagram images for demo content.

This script creates actual diagram files that the sample content.md references.
Run: python output/example_diagrams.py
"""

import json
import os
import subprocess
import sys

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(PROJECT_DIR, "scripts")
DIAGRAMS_DIR = os.path.join(PROJECT_DIR, "output", "diagrams")
CHARTS_DIR = os.path.join(PROJECT_DIR, "output", "charts")

os.makedirs(DIAGRAMS_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)


def safe_run(cmd, **kwargs):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    except FileNotFoundError:
        result = type('obj', (object,), {'returncode': -1, 'stderr': f'Tool not found: {cmd[0]}', 'stdout': ''})()
        return result


def run_script(script, args):
    cmd = [sys.executable, os.path.join(SCRIPTS_DIR, script)] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  WARNING: {script} stderr: {result.stderr[:200]}")
        return result
    except FileNotFoundError:
        print(f"  WARNING: cannot run {script}")
        return type('obj', (object,), {'returncode': -1, 'stderr': 'Python not found', 'stdout': ''})()


print("Generating sample diagrams...")

# Flow diagram (Mermaid)
flow_mmd = """graph TD
    A[Client Request] --> B[API Gateway]
    B --> C{Authenticated?}
    C -->|Yes| D[Route to Service]
    C -->|No| E[Return 401]
    D --> F[Service Handler]
    F --> G[Database Query]
    G --> H[Format Response]
    H --> I[Return to Client]
"""
with open("/tmp/flow.mmd", "w") as f:
    f.write(flow_mmd)

result = safe_run(
    ["mmdc", "-i", "/tmp/flow.mmd", "-o", os.path.join(DIAGRAMS_DIR, "flow-diagram.svg"), "-t", "neutral"],
)
if result.returncode != 0:
    print(f"  NOTE: mmdc not available. Creating placeholder.")
    with open(os.path.join(DIAGRAMS_DIR, "flow-diagram.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Flow Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install mmdc for rendered output)</text></svg>')
else:
    print("  flow-diagram.svg created")

# Sequence diagram (Mermaid)
seq_mmd = """sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant U as User Service
    participant D as Database

    C->>G: POST /api/login
    G->>A: Validate credentials
    A->>D: Query user
    D-->>A: User record
    A-->>G: JWT Token
    G-->>C: 200 OK + Token

    C->>G: GET /api/profile
    G->>A: Verify token
    A-->>G: Token valid
    G->>U: Get profile
    U->>D: Query profile
    D-->>U: Profile data
    U-->>G: Profile
    G-->>C: 200 OK + Profile
"""
with open("/tmp/seq.mmd", "w") as f:
    f.write(seq_mmd)

result = safe_run(
    ["mmdc", "-i", "/tmp/seq.mmd", "-o", os.path.join(DIAGRAMS_DIR, "sequence-diagram.svg"), "-t", "neutral"],
)
if result.returncode != 0:
    with open(os.path.join(DIAGRAMS_DIR, "sequence-diagram.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Sequence Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install mmdc for rendered output)</text></svg>')
else:
    print("  sequence-diagram.svg created")

# Class diagram (Mermaid)
class_mmd = """classDiagram
    class User {
        +UUID id
        +String email
        +String name
        +DateTime createdAt
        +authenticate(password) bool
        +updateProfile(data) void
    }
    class AuthToken {
        +String token
        +UUID userId
        +DateTime expiresAt
        +isValid() bool
        +refresh() AuthToken
    }
    class Profile {
        +UUID userId
        +String avatar
        +JSON preferences
        +getSettings() JSON
    }
    User "1" --> "*" AuthToken : has
    User "1" --> "1" Profile : has
"""
with open("/tmp/class.mmd", "w") as f:
    f.write(class_mmd)

result = safe_run(
    ["mmdc", "-i", "/tmp/class.mmd", "-o", os.path.join(DIAGRAMS_DIR, "class-diagram.svg"), "-t", "neutral"],
)
if result.returncode != 0:
    with open(os.path.join(DIAGRAMS_DIR, "class-diagram.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Class Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install mmdc for rendered output)</text></svg>')
else:
    print("  class-diagram.svg created")

# Architecture diagram (Python diagrams)
arch_py = """from diagrams import Diagram, Edge
from diagrams.generic.blank import Blank
from diagrams.programming.framework import Angular

with Diagram("System Architecture", show=False, filename="architecture-diagram", outformat="svg", direction="TB"):
    pass
"""

with open("/tmp/arch.py", "w") as f:
    f.write(arch_py)

result = safe_run(
    [sys.executable, "/tmp/arch.py"],
    cwd=DIAGRAMS_DIR,
)
if result.returncode != 0:
    with open(os.path.join(DIAGRAMS_DIR, "architecture-diagram.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Architecture Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install diagrams for rendered output)</text></svg>')
else:
    print("  architecture-diagram.svg created")

# Use case diagram (PlantUML)
puml = """@startuml
left to right direction
actor "End User" as user
actor "Administrator" as admin
rectangle "System" {
  usecase "Login" as UC1
  usecase "View Dashboard" as UC2
  usecase "Manage Users" as UC3
  usecase "Generate Report" as UC4
  usecase "Configure System" as UC5
}
user --> UC1
user --> UC2
user --> UC4
admin --> UC3
admin --> UC5
UC1 <.. UC2 : <<include>>
UC4 <.. UC2 : <<extend>>
@enduml
"""
with open("/tmp/usecase.puml", "w") as f:
    f.write(puml)

plantuml_jar = os.path.expanduser("~/.local/share/open-report/plantuml.jar")
if os.path.exists(plantuml_jar):
    result = safe_run(
        ["java", "-jar", plantuml_jar, "-tsvg", "-output", DIAGRAMS_DIR, "/tmp/usecase.puml"],
    )
    if result.returncode != 0:
        with open(os.path.join(DIAGRAMS_DIR, "usecase-diagram.svg"), "w") as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Use Case Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install plantuml for rendered output)</text></svg>')
    else:
        generated = os.path.join(DIAGRAMS_DIR, "usecase.svg")
        target = os.path.join(DIAGRAMS_DIR, "usecase-diagram.svg")
        if os.path.exists(generated):
            os.rename(generated, target)
        print("  usecase-diagram.svg created")
else:
    with open(os.path.join(DIAGRAMS_DIR, "usecase-diagram.svg"), "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f8f9fa"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">Use Case Diagram</text><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">(install plantuml for rendered output)</text></svg>')

print("Generating sample charts...")

# Bar chart
bar_config = json.dumps({
    "title": "API Requests by Service (Daily)",
    "xlabel": "Service",
    "ylabel": "Requests (thousands)",
    "data": {
        "labels": ["Auth", "User", "Data", "Notify", "Gateway", "Search"],
        "values": [45, 128, 312, 67, 520, 89],
    }
})
run_script("render_charts.py", ["--type", "bar", "--config", bar_config, "--output", os.path.join(CHARTS_DIR, "bar-chart.svg")])
print("  bar-chart.svg created")

# Line chart
line_config = json.dumps({
    "title": "API Gateway Latency (ms) - Last 24 Hours",
    "xlabel": "Hour",
    "ylabel": "Latency (ms)",
    "data": {
        "series": [
            {"x": list(range(0, 24)), "y": [12, 14, 10, 8, 7, 9, 15, 22, 35, 48, 42, 38, 30, 28, 25, 29, 33, 40, 45, 38, 30, 22, 18, 15], "label": "P95 Latency"},
            {"x": list(range(0, 24)), "y": [5, 5, 4, 3, 3, 4, 6, 8, 12, 15, 13, 11, 10, 9, 8, 9, 11, 13, 15, 12, 10, 8, 7, 6], "label": "P50 Latency"},
        ]
    }
})
run_script("render_charts.py", ["--type", "line", "--config", line_config, "--output", os.path.join(CHARTS_DIR, "line-chart.svg")])
print("  line-chart.svg created")

# Pie chart
pie_config = json.dumps({
    "title": "Service Resource Allocation",
    "data": {
        "labels": ["Auth Service", "User Service", "Data Service", "Notification", "Gateway"],
        "values": [15, 20, 35, 10, 20],
    },
    "donut": True,
})
run_script("render_charts.py", ["--type", "pie", "--config", pie_config, "--output", os.path.join(CHARTS_DIR, "pie-chart.svg")])
print("  pie-chart.svg created")

print("\nDone! All sample diagrams and charts generated in output/")
