# DATABASE LAYER

## OVERVIEW

PostgreSQL under `police` schema (not `public`). Drizzle ORM for schema/migrations, raw SQL for AI queries.

## STRUCTURE

```
db/
├── index.ts              # Connection pool (node-postgres + Drizzle)
├── migrate.ts            # Programmatic migration runner
├── seed.ts               # Orchestrator (requires DB_SEEDING=true env)
├── police-seed.ts        # Police-specific seed wrapper
├── schemas/
│   ├── police.ts         # All tables under pgSchema("police")
│   └── utils.ts          # lifecycleDates mixin (createdAt, updatedAt)
├── seeds/police/
│   ├── *.ts              # Per-entity seed modules
│   └── data/*.json       # Seed data (derived from root data/police-data.csv)
└── migrations/           # Drizzle-generated SQL migrations
```

## WHERE TO LOOK

| Task                  | File                                            | Notes                                 |
| --------------------- | ----------------------------------------------- | ------------------------------------- |
| Add/modify tables     | `schemas/police.ts`                             | All in `pgSchema("police")` namespace |
| Add lifecycle columns | `schemas/utils.ts`                              | `lifecycleDates` spread mixin         |
| Add new entity seed   | `seeds/police/`                                 | Create module + JSON in `data/`       |
| Run migrations        | `bun run db:generate` then `bun run db:migrate` |                                       |
| Inspect DB            | `bun run db:studio`                             | Drizzle Studio GUI                    |

## CONVENTIONS

- Mixed ID strategy: `serial` for reference/transaction tables, nanoid `varchar(20)` with typed prefix for entities
- All queries from AI pipeline use `police.table_name` prefix (schema-qualified)
- `migrate.ts` and `seed.ts` are bundled to `.mjs` for Docker (run on Node, not Bun)

## ANTI-PATTERNS

- `district_id` is ALWAYS NULL in `locations` — data quality issue, worked around in AI prompts
- `reportersTable.totalReports` is a denormalized counter with no trigger or app logic maintaining it
- No GENERATED columns — PostgreSQL limitation noted in schema comments; use `EXTRACT()` in queries
- `lib/id.ts` has prefixes for unrelated domains (student, food, etc.) — shared utility from parent org
