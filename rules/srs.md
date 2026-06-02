# SRS Rules

## Use case flow tables
Context: SRS use cases need BA-readable flow specs.
Mistake: Writing main, alternative, or exception flows as prose bullets.
Correct rule: Use flow tables with `Step`, `Actor`, `System Response` columns.
Example fix: Convert each actor action/system response pair into numbered table rows.

## Include/extend direction
Context: PlantUML use case diagrams must match Cockburn/UML semantics.
Mistake: Drawing `<<include>>` or `<<extend>>` from actor to use case, or reversing direction.
Correct rule: Include is base UC → included UC; extend is extending UC → base UC.
Example fix: `UC1 ..> UC2 : <<include>>`; `UC4 ..> UC1 : <<extend>>`.

## Use case ID consistency
Context: SRS specs, diagrams, and sequence diagrams reference same use cases.
Mistake: Using different names/IDs across sections.
Correct rule: Use `UC-{MODULE}-{SEQ}` everywhere, with exact same UC name.
Example fix: `UC-AUTH-01 Login` appears unchanged in spec heading, UC diagram label, SD filename.
