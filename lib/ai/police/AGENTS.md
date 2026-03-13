# AI POLICE PIPELINE

## OVERVIEW

Unified router → agent dispatch → optional SQL pipeline → streaming response + charts. All orchestration in `app/api/chat/police/route.ts`, not here.

## STRUCTURE

```
police/
├── unified-router.ts     # Classifier + query planner in ONE LLM call
├── sql-generator.ts      # PlannedQuery → executable SQL
├── query-executor.ts     # Parallel SQL execution via sql.raw()
├── result-synthesizer.ts # Completeness check + optional follow-up query
├── chart-generator.ts    # LLM picks chart type + resultIndex, data attached after
├── prompts.ts            # All pipeline-internal prompt constants
├── schema.ts             # Zod schemas for structured LLM outputs
├── query-planner.ts      # DEAD CODE — type PlannedQuery still used, function is not
├── agents/
│   ├── general/          # Conversational agent (receives full message history)
│   └── information/      # Data agent (receives constructed prompt, NO history)
└── evals/
    └── classifier.eval.ts  # 40 Thai test cases, evalite, binary accuracy scorer
```

## WHERE TO LOOK

| Task                        | File                                                           | Notes                                        |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Add/modify routing logic    | `unified-router.ts`                                            | Returns `queryType` + up to 5 `PlannedQuery` |
| Change SQL generation rules | `prompts.ts` → `SQL_GENERATOR_SYSTEM_PROMPT`                   | 800+ line prompt with full schema docs       |
| Modify agent behavior       | `agents/*/prompt.md`                                           | Imported as raw string                       |
| Add chart types             | `chart-generator.ts` + `prompts.ts` → chart section            | LLM outputs config, not data                 |
| Add eval cases              | `evals/classifier.eval.ts` → `policeDataset`                   | Inline dataset, not separate file            |
| Change completeness logic   | `result-synthesizer.ts` → `shouldSkipCompletenessEvaluation()` | Short-circuit for happy path                 |

## CONVENTIONS

- Structured output via `Output.object()` with Zod schemas — every call has `@typescript-eslint/no-explicit-any` disable comment (Zod v4 compat)
- Every system prompt wrapped in `withBaseContext()` for date/timezone injection
- `getRetryableModel()` used for ALL pipeline calls EXCEPT input guardrail
- Agents are asymmetric: general gets `messages`, information gets `prompt` string
- `PlannedQuery` type from `query-planner.ts` is the shared DTO — the function is dead, the type is not

## ANTI-PATTERNS

- `district_id` is always NULL — prompts instruct to use `location_specific LIKE` instead
- `sql.raw()` with no parameterization — `validateSQLQuery()` regex is the only protection
- Chart generation requires `data.length >= 2` — single-value results are filtered out pre-LLM
- Follow-up query limited to exactly 1 — no recursive loop
- `eval-dataset.ts` exists but is empty — dataset lives directly in `classifier.eval.ts`
