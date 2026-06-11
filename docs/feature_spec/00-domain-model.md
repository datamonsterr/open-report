# open-report Domain Model

AI-assisted report generation tool producing standalone HTML reports from codebase analysis. Uses opencode agent harness with custom skills and subagents.

## Language

**Project**:
A top-level container grouping reports, linked GitHub repos, materials, and user-defined context. Stored under `~/.open-report/<project_name>/` as a git repo with `project.json` config.
_Avoid_: Workspace, folder, workspace

**Report**:
A named output folder under `output/` containing rendered HTML, diagrams, charts, and `artifacts.json` metadata.
_Avoid_: Document, page, slide

**Template**:
A named bundle of skills, rules, and subagent configurations used to drive report creation. Stored in SQLite metadata.
_Avoid_: Preset, blueprint, scaffold

**Artifact**:
A rendered output file (typically SVG, PNG, or HTML) produced by a script. Tracked by `artifacts.json` with id, path, type, alt text, and layout hint.
_Avoid_: File, output, resource

**Skill**:
An opencode skill directory containing `SKILL.md`. User-facing skills use `open-report-` prefix and live in `./skills/`. Native opencode skills live in `.opencode/skills/`.
_Avoid_: Plugin, extension, module

**Subagent**:
A specialized agent type in the opencode harness (e.g., `diagram-renderer`, `report-renderer`, `tester`). Dispatched by the main agent for specific tasks.
_Avoid_: Agent, worker, bot

**Render**:
The act of running a script to produce an artifact image (diagram or chart). Distinct from "assemble" which combines artifacts into the final HTML.
_Avoid_: Generate, build, compile

**Assemble**:
The act of combining markdown content, rendered artifacts, and CSS into a standalone HTML report file.
_Avoid_: Render, generate, build

**Session**:
An opencode chat session tied to a specific report. Tracks conversation history, tool calls, and agent state. Managed by `opencode serve`.
_Avoid_: Chat, conversation, thread

## Relationships

- A **Project** contains multiple **Reports**
- A **Project** links multiple GitHub **Repos** and **Materials**
- A **Report** belongs to one **Project**
- A **Report** contains multiple **Artifacts**
- A **Template** bundles multiple **Skills**, **Rules**, and **Subagent** configs
- A **Render** produces one **Artifact**
- An **Assemble** consumes multiple **Artifacts** to produce one HTML report
- A **Session** belongs to one **Report**

## Example dialogue

> **Dev:** "When I click 'New Report' and pick the SRS template, what happens to the session?"
> **Domain expert:** "A new **Session** is created via `opencode serve`. The **Template**'s skills are loaded into the session context. The guided init wizard starts in the chat panel asking about report type and target project."

> **Dev:** "After the render step, do I need to manually trigger the assemble step?"
> **Domain expert:** "No — the `report-renderer` **Subagent** handles both **Render** (diagrams) and **Assemble** (final HTML) as a pipeline."

## Flagged ambiguities

- "render" was used to mean both diagram/image generation and final HTML assembly — resolved: **Render** = producing artifact images; **Assemble** = building final HTML.
- "skill" was used without distinguish open-report vs opencode-native — resolved: `open-report-*` prefix in `./skills/` for user-facing; no prefix in `.opencode/skills/` for opencode-native.
