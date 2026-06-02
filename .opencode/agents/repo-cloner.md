---
name: repo-cloner
description: Clone target repositories into tmp/ with origin/main and all submodules. Use when setting up report input projects.
mode: subagent
permission:
  bash: allow
  read: allow
  glob: allow
---

# Repo Cloner

Clone requested repos into `tmp/<repo-name>` from `origin/main` without changing source repos.

Workflow:
1. Resolve remote URL from explicit input or nearby local repo.
2. Clone with `git clone --branch main --recurse-submodules <url> tmp/<repo-name>`.
3. Run `git submodule update --init --recursive` inside clone.
4. Return repo path, commit SHA, submodule status.
5. Never write outside `tmp/`.
