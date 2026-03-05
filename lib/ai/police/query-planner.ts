import { generateText, ModelMessage, Output } from "ai";
import { z } from "zod";
import { getRetryableModel } from "../openrouter";
import { SQL_GENERATOR_SYSTEM_PROMPT } from "./prompts";
import { withBaseContext } from "../base-context";
import { queryPlanSchema } from "./schema";

type QueryPlanResult = z.infer<typeof queryPlanSchema>;

interface QueryPlannerOptions {
  messages: ModelMessage[];
}

export interface PlannedQuery {
  sql: string;
  purpose: string; // What this query is trying to find out
  priority: number; // 1 (highest) to 5 (lowest)
}

export async function queryPlanner(opts: QueryPlannerOptions): Promise<PlannedQuery[]> {
  const enhancedSystemPrompt = withBaseContext(`${SQL_GENERATOR_SYSTEM_PROMPT}

## QUERY PLANNING MODE

You are now in QUERY PLANNING mode for complex questions. Instead of generating a single query, you must generate 1-5 queries that together answer the user's multi-part question.

### Planning Guidelines

1. **Identify Sub-Questions**: Break down the user's question into distinct information needs
   - Example: "Show pending cases AND active investigators AND closed cases AND top incident types AND top districts" → 5 separate queries
   - Decompose every distinct requirement into its own query

2. **Generate Complementary Queries**: Each query should retrieve different aspects
   - Query 1 (Priority 1): Core statistics (counts, totals, critical metrics)
   - Query 2 (Priority 2): Secondary statistics or counts
   - Query 3 (Priority 3): Detailed breakdowns or trends
   - Query 4 (Priority 4): Rankings or top N items
   - Query 5 (Priority 5): Additional context or supplementary analysis

3. **Prioritize Queries**: Assign priority based on importance to answering the question
   - Priority 1: Essential data that directly answers the main question
   - Priority 2: Important supporting statistics
   - Priority 3: Important context or secondary information
   - Priority 4: Ranking/comparison data
   - Priority 5: Nice-to-have supplementary details or trends

4. **Keep Queries Independent**: Each query should run independently (no dependencies)
   - ✅ Good: Query 1 counts cases, Query 2 groups by month, Query 3 counts investigators
   - ❌ Bad: Query 2 depends on results from Query 1

5. **Avoid Redundancy**: Don't retrieve the same data in multiple queries
   - If two sub-questions can be answered in one query with proper JOINs, combine them

<thinking-instructions>
Before planning queries:
1. Break the user's question into distinct information needs
2. For each need, determine which tables and joins are required
3. Assign priorities: core answer = 1, supporting stats = 2-3, supplementary = 4-5
4. Ensure each query is independent — no query should depend on another's results
5. Avoid redundancy — don't retrieve the same data in multiple queries
</thinking-instructions>

<example>
User Question: "สรุปภาพรวมระบบงานของสถานีตำรวจ: คดีที่รออยู่กี่คดี, ผู้สืบสวนที่กำลังทำงานกี่คน, คดีที่ปิดในเดือนนี้กี่คดี, ประเภทคดีที่เกิดบ่อยที่สุด 5 อันดับพร้อมจำนวน, และเขตที่มีปัญหามากที่สุด 3 เขต"

Query Plan (5 queries):

Query 1 (Priority 1):
- Purpose: Count cases that are not yet closed
- SQL: SELECT COUNT(*) as pending_cases FROM police.incident_reports ir JOIN police.case_statuses cs ON ir.status_id = cs.id WHERE cs.is_closed = false;

Query 2 (Priority 2):
- Purpose: Count active investigators currently working
- SQL: SELECT COUNT(*) as active_investigators FROM police.investigators WHERE is_active = true;

Query 3 (Priority 3):
- Purpose: Count cases closed in the current month
- SQL: SELECT COUNT(*) as closed_cases_this_month FROM police.incident_reports ir JOIN police.case_statuses cs ON ir.status_id = cs.id WHERE cs.is_closed = true AND DATE_TRUNC('month', ir.case_closed_date) = DATE_TRUNC('month', CURRENT_DATE);

Query 4 (Priority 4):
- Purpose: Get top 5 most common incident types with counts
- SQL: SELECT it.incident_type_name_th, COUNT(*) as count FROM police.incident_reports ir JOIN police.incident_types it ON ir.incident_type_id = it.id GROUP BY it.id, it.incident_type_name_th ORDER BY count DESC LIMIT 5;

Query 5 (Priority 5):
- Purpose: Get top 3 districts/areas with most cases
- SQL: SELECT p.province_name_th, COUNT(*) as case_count FROM police.incident_reports ir JOIN police.locations l ON ir.location_id = l.id JOIN police.provinces p ON l.province_id = p.id GROUP BY p.id, p.province_name_th ORDER BY case_count DESC LIMIT 3;
</example>

### Response Format

Generate a structured query plan with 1-5 queries. Each query must:
- Be a valid PostgreSQL SELECT statement
- Include schema prefix (police.table_name)
- Be independent and executable on its own
- Have a clear purpose and priority
`);

  const { output } = (await generateText({
    model: getRetryableModel(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type incompatibility with AI SDK Output API
    output: Output.object({ schema: queryPlanSchema as any }),
    system: enhancedSystemPrompt,
    messages: opts.messages,
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "query-planner",
      recordInputs: true,
      recordOutputs: true,
    },
  })) as { output: QueryPlanResult };

  return output.queries.sort((a, b) => a.priority - b.priority);
}
