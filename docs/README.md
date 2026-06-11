# open-report Documentation

## Folder Structure

```
docs/
├── README.md                   # You are here — how to use this folder
├── feature_spec/               # Ground-truth feature specifications
│   ├── 00-domain-model.md      # Domain language, relationships, glossary
│   ├── 01-project-management.md
│   ├── 02-report-management.md
│   ├── 03-template-management.md
│   ├── 04-chat-interface.md
│   ├── 05-report-preview.md
│   └── 06-guided-initialization.md
├── technical_spec/             # Technical decisions with decision points
└── living_spec/                # Synced working copy (auto-maintained)
    └── README.md
```

## How to Use

### Reading
- **Feature specs** (`feature_spec/`): Ground truth for what the product does. Start here to understand any feature. These are the source of truth.
- **Technical specs** (`technical_spec/`): How we build it. Each doc contains open decision points marked with `[DECISION]`. Fill these in before implementation starts.
- **Living specs** (`living_spec/`): Working copies synced from `feature_spec/`. Consumed by agents during implementation. Never edit these directly.

### Workflow

1. **New feature**: Add to `feature_spec/` → run `update-living-spec` → implement
2. **Feature change**: Update `feature_spec/` → run `update-living-spec` → review diffs
3. **Technical decision**: Read `technical_spec/` → fill `[DECISION]` blocks → implement
4. **Agent implementation**: Agents invoke `read-living-spec` skill to pull `living_spec/` for current context

### Commands

```bash
# Sync feature_spec → living_spec
# (invoke update-living-spec skill, dispatches spec-syncer subagent)

# Pull living spec for current work
# (invoke read-living-spec skill, dispatches spec-puller subagent)
```

## Rules

- `feature_spec/` is the ground truth. All changes originate here.
- `technical_spec/` captures decisions. Archive decisions once implemented.
- `living_spec/` is auto-generated. Do not edit directly.
- Each feature spec must be self-contained — read one file to understand one feature.
- Cross-references between specs use relative links.
- Domain language is defined in `feature_spec/00-domain-model.md`. Use these terms consistently.
