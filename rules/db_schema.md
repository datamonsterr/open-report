# DB Schema Rules

## Schema evidence
Context: Reports often infer entities from ORM, migrations, SQL, or docs.
Mistake: Presenting inferred DB schema as confirmed when no migration/model source exists.
Correct rule: Mark schema source and confidence for each entity/table.
Example fix: `User` — source: `prisma/schema.prisma`; confidence: confirmed.

## Entity naming
Context: SRS and architecture reports need stable domain language.
Mistake: Mixing table names, class names, and UI labels without mapping.
Correct rule: Define canonical domain term plus technical aliases.
Example fix: `Customer Account` (`users` table, `User` model, "Profile" UI label).
