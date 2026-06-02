---
name: init-report-project
description: Initialize a target project clone and analysis workspace for open-report.
category: report
---

# /init-report-project

Usage:

```
/init-report-project <repo-url-or-local-path> [name]
```

Steps:
1. Dispatch `repo-cloner` agent.
2. Clone `origin/main` with `--recurse-submodules` into `tmp/<name>`.
3. Dispatch `project-analyzer` agent.
4. Write analysis to `output/analysis.md`.
5. Ask report style questions if missing.
6. Ask report content scope questions if missing.
