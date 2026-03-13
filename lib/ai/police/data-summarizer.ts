import { generateText, Output } from "ai";
import db from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRetryableModel } from "@/lib/ai/container";
import { validateSQLQuery } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { withBaseContext } from "../base-context";
import { DATA_SUMMARIZER_SYSTEM_PROMPT } from "./prompts";
import { dataSummarizerSchema } from "./schema";
import type { QueryResult } from "./query-executor";

const SUMMARIZE_THRESHOLD = 30;

export interface SummarizedData {
  originalPurpose: string;
  originalRowCount: number;
  summaryData: unknown[];
  summarySql: string;
}

interface DataSummarizerOptions {
  results: QueryResult[];
  userQuestion: string;
}

export async function dataSummarizer(opts: DataSummarizerOptions): Promise<SummarizedData[]> {
  const successfulResults = opts.results.filter((r) => r.success && r.data && r.data.length > SUMMARIZE_THRESHOLD);

  if (successfulResults.length === 0) {
    return [];
  }

  const summaryPromises = successfulResults.map(async (result) => {
    const data = result.data as Record<string, unknown>[];
    const columns = Object.keys(data[0]);

    const prompt = `
User Question:
${opts.userQuestion}

Original SQL:
${result.sql}

Purpose: ${result.purpose}
Row Count: ${data.length}
Columns: ${columns.join(", ")}

Generate a summary SQL that wraps the original SQL as a subquery and produces a compact aggregated result (max 30 rows) that captures the key insights needed to answer the user's question.
    `.trim();

    try {
      const generateResult = await generateText({
        model: getRetryableModel(),
        system: withBaseContext(DATA_SUMMARIZER_SYSTEM_PROMPT),
        messages: [{ role: "user", content: prompt }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type incompatibility with AI SDK Output API
        output: Output.object({ schema: dataSummarizerSchema as any }),
        temperature: 0,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "data-summarizer",
          recordInputs: true,
          recordOutputs: true,
        },
      });

      const { output } = generateResult as unknown as {
        output: { summarySql: string; reasoning: string };
      };

      logger.debug(
        {
          step: "data-summarizer",
          inputTokens: generateResult.usage.inputTokens,
          outputTokens: generateResult.usage.outputTokens,
          totalTokens: generateResult.usage.totalTokens,
          reasoning: output.reasoning,
        },
        "ai step completed",
      );

      const validation = validateSQLQuery(output.summarySql);
      if (!validation.isValid) {
        logger.warn(
          { error: validation.error, summarySql: output.summarySql },
          "data-summarizer: generated invalid SQL, falling back to original data",
        );
        return null;
      }

      const dbResult = await db.execute(sql.raw(output.summarySql));

      return {
        originalPurpose: result.purpose,
        originalRowCount: data.length,
        summaryData: dbResult.rows as unknown[],
        summarySql: output.summarySql,
      } satisfies SummarizedData;
    } catch (error) {
      logger.warn(
        { error, purpose: result.purpose },
        "data-summarizer: failed to summarize, falling back to original data",
      );
      return null;
    }
  });

  const results = await Promise.allSettled(summaryPromises);

  return results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter((r): r is SummarizedData => r !== null);
}
