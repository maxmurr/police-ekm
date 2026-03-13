# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-13
**Commit:** 1a3bb12
**Branch:** main

## OVERVIEW

Thai police incident "chat-with-data" system. Next.js 16 + Vercel AI SDK + PostgreSQL/Drizzle + OpenRouter (Qwen/Llama models). Users ask questions in Thai → AI classifies → either converses or generates SQL → streams formatted results + charts.

## STRUCTURE

```
./
├── app/                    # Next.js App Router (3 API routes, 1 page)
├── components/
│   ├── ai-elements/        # VENDORED from ai-sdk registry — do not edit
│   ├── chat/               # Chat UI (message list, input, charts, feedback)
│   └── ui/                 # shadcn/ui (new-york style)
├── data/                   # Source CSV (police-data.csv) — seed origin
├── hooks/                  # use-chart-palette only
├── lib/
│   ├── ai/                 # AI pipeline (guardrail, router, models)
│   │   └── police/         # Domain-specific pipeline — see lib/ai/police/AGENTS.md
│   └── db/                 # Database layer — see lib/db/AGENTS.md
└── scripts/                # CI/Docker build scripts (GitLab CI)
```

## WHERE TO LOOK

| Task                               | Location                                                     | Notes                                                      |
| ---------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Chat endpoint orchestration        | `app/api/chat/police/route.ts`                               | The pipeline controller — all flow lives here              |
| AI model config / retry / fallback | `lib/ai/openrouter.ts`                                       | Two-tier retry: same model → fallback model                |
| Input safety                       | `lib/ai/input-guardrail.ts`                                  | Uses `openai/gpt-oss-safeguard-20b`, NOT the primary model |
| Agent prompts                      | `lib/ai/police/agents/*/prompt.md`                           | Loaded as raw strings via webpack/turbopack                |
| Pipeline-internal prompts          | `lib/ai/police/prompts.ts`                                   | Router, SQL gen, chart gen, evaluator prompts              |
| SQL validation                     | `lib/utils.ts` → `validateSQLQuery()`                        | Regex-based allowlist, no parameterization                 |
| Custom message types               | `app/api/chat/police/route.ts` → `MyMessage`                 | Exported from route, imported by lib + components          |
| Trace ID → feedback flow           | `lib/trace-id-context.tsx` + `lib/tracing-chat-transport.ts` | React context in `lib/`, not `components/`                 |
| Wide-event logging                 | `lib/wide-event.ts`                                          | Single structured log per request, Pino                    |
| Chart data formatting              | `lib/rechart-format.ts`                                      | Pivots flat records to per-category columns                |
| ID generation                      | `lib/id.ts`                                                  | Has prefixes from OTHER projects (shared utility)          |

## CONVENTIONS

- **Prompts as `.md` files** for agents; `prompts.ts` for pipeline-internal prompts
- **`@ai-sdk-tools/store`** replaces standard `useChat` from `ai` package
- **Tailwind v4** — config via CSS (`app/globals.css`), no `tailwind.config.js`
- **`components/ai-elements/`** is vendored — excluded from ESLint, do not modify
- **`reset.d.ts`** imports `@total-typescript/ts-reset` — do not add other code to this file
- **`markdown.d.ts`** enables `import x from "./file.md"` pattern
- **TypeScript errors ignored in build** (`typescript.ignoreBuildErrors: true`) — typecheck runs in pre-commit via lefthook
- **Standalone output** for Docker deployment; final image runs on Node, not Bun
- **Dark mode forced** unconditionally in root layout

## ANTI-PATTERNS (THIS PROJECT)

- `district_id` is ALWAYS NULL in locations table — filter via `location_specific LIKE '%เขตX%'`
- `sql.raw()` executes LLM-generated SQL with NO parameterization — `validateSQLQuery()` is the only guard
- `queryPlanner()` function in `query-planner.ts` is dead code — planning happens in `unifiedRouter`
- `CLASSIFIER_SYSTEM_PROMPT` in `prompts.ts` is dead code — replaced by unified router
- `uiSpecGeneratorSystemPrompt` in `prompts.ts` appears unused (future work)
- `MyMessage` type exported from route file creates inverted dependency (`lib/` imports from `app/api/`)
- `lib/id.ts` contains prefixes from other projects (student, guardian, food, etc.)

## COMMANDS

```bash
bun run dev              # Dev server (Turbopack)
bun run build            # Production build (Turbopack)
bun run lint             # ESLint
bun run check-types      # tsc --noEmit (separate from build)
bun run db:generate      # Drizzle migration generation
bun run db:migrate       # Apply migrations
bun run db:seed          # Seed (requires DB_SEEDING=true)
bun run db:studio        # Drizzle Studio GUI
bun run eval:dev         # Evalite watch mode
```

## NOTES

- `MAX_CONTEXT_MESSAGES = 5` — only last 5 messages sent to router/agents
- Information agent receives a constructed prompt string (no history); general agent gets full history
- Chart generator uses `resultIndex` indirection — LLM picks which result to chart, data attached server-side
- Completeness evaluation is skipped when all queries succeed with data (optimization)
- `maxDuration = 300` (5 min) on the chat route for Vercel function timeout
- Pre-commit hooks: prettier + eslint + typecheck (parallel via lefthook)
- Commit messages enforced via commitlint (conventional commits)
- OTel → Langfuse for AI tracing; direct Langfuse SDK only for feedback scoring
- `data/police-data.csv` is the original source; JSON seed files in `lib/db/seeds/police/data/` are derived from it
