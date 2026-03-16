import { generateText, ModelMessage, Output } from "ai";
import { z } from "zod";
import { getRetryableModel } from "@/lib/ai/container";
import { logger } from "@/lib/logger";
import { QueryResult, QueryUpdate, executeSingleQuery } from "./query-executor";
import { PlannedQuery } from "./query-planner";
import { EVALUATE_COMPLETENESS_SYSTEM_PROMPT, FOLLOW_UP_QUERY_SYSTEM_PROMPT } from "./prompts";
import { withBaseContext } from "../base-context";
import { evaluateCompletenessSchema } from "./schema";

type CompletenessResult = z.infer<typeof evaluateCompletenessSchema>;

export function shouldSkipCompletenessEvaluation(results: QueryResult[]): boolean {
  if (results.length === 0) return false;

  const allSucceeded = results.every((r) => r.success);
  const allHaveData = results.every((r) => r.data && r.data.length > 0);

  if (allSucceeded && allHaveData) return true;

  if (results.length === 1 && results[0].success && results[0].data?.length) {
    return true;
  }

  return false;
}

interface ResultSynthesizerOptions {
  results: QueryResult[];
  originalQuestion: string;
  messages: ModelMessage[];
  onQueryUpdate?: (update: QueryUpdate) => void;
}

export interface SynthesizedResult {
  allResults: QueryResult[];
  needsFollowUp: boolean;
  followUpQuery?: PlannedQuery;
  summary: string;
}

async function evaluateCompleteness(
  results: QueryResult[],
  originalQuestion: string,
  messages: ModelMessage[],
): Promise<{
  needsFollowUp: boolean;
  reasoning: string;
  suggestedQuery?: string;
}> {
  const systemPrompt = withBaseContext(EVALUATE_COMPLETENESS_SYSTEM_PROMPT);

  const resultsSummary = results
    .map(
      (r, i) => `
Query ${i + 1} (Priority ${r.priority}):
Purpose: ${r.purpose}
Success: ${r.success}
${r.success ? `Rows: ${r.data?.length || 0}` : `Error: ${r.error}`}
${r.success && r.data && r.data.length > 0 ? `Sample: ${JSON.stringify(r.data[0])}` : ""}
`,
    )
    .join("\n");

  const result = await generateText({
    model: await getRetryableModel(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type incompatibility with AI SDK Output API
    output: Output.object({ schema: evaluateCompletenessSchema as any }),
    system: systemPrompt,
    messages: [
      ...messages,
      {
        role: "user",
        content: `Original Question: ${originalQuestion}

Query Results:
${resultsSummary}

Evaluate if these results sufficiently answer the question.`,
      },
    ],
    temperature: 0.1,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "evaluate-completeness",
      recordInputs: true,
      recordOutputs: true,
    },
  });

  const { output } = result as unknown as { output: CompletenessResult };
  logger.debug(
    {
      step: "evaluate-completeness",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    },
    "ai step completed",
  );

  return output;
}

async function generateFollowUpQuery(
  originalQuestion: string,
  currentResults: QueryResult[],
  messages: ModelMessage[],
  suggestedQuery?: string,
): Promise<PlannedQuery> {
  const systemPrompt = withBaseContext(FOLLOW_UP_QUERY_SYSTEM_PROMPT);

  const contextMessage = `### Context

Original Question: ${originalQuestion}

Previous Query Results:
${currentResults
  .map(
    (r, i) => `
Query ${i + 1}: ${r.purpose}
Success: ${r.success}
${r.success ? `Data: ${r.data?.length || 0} rows` : `Error: ${r.error}`}
`,
  )
  .join("\n")}

${suggestedQuery ? `Suggested Focus: ${suggestedQuery}` : ""}`;

  const result = await generateText({
    model: await getRetryableModel(),
    system: systemPrompt,
    messages: [...messages, { role: "user" as const, content: contextMessage }],
    temperature: 0.1,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "follow-up-query-generator",
      recordInputs: true,
      recordOutputs: true,
    },
  });

  logger.debug(
    {
      step: "follow-up-query-generator",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    },
    "ai step completed",
  );

  return {
    sql: result.text.trim(),
    purpose: "Follow-up query to supplement initial results",
    priority: 2,
  };
}

export async function resultSynthesizer(opts: ResultSynthesizerOptions): Promise<SynthesizedResult> {
  const { results, originalQuestion, messages, onQueryUpdate } = opts;

  const evaluation = await evaluateCompleteness(results, originalQuestion, messages);

  if (!evaluation.needsFollowUp) {
    return {
      allResults: results,
      needsFollowUp: false,
      summary: evaluation.reasoning,
    };
  }

  const followUpQuery = await generateFollowUpQuery(originalQuestion, results, messages, evaluation.suggestedQuery);

  const followUpResult = await executeSingleQuery(followUpQuery, onQueryUpdate);

  return {
    allResults: [...results, followUpResult],
    needsFollowUp: true,
    followUpQuery,
    summary: `Follow-up query executed: ${evaluation.reasoning}`,
  };
}
