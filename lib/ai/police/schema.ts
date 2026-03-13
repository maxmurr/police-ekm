import { configSchema } from "@/lib/types";
import z from "zod";

export const evaluateCompletenessSchema = z.object({
  needsFollowUp: z.boolean().describe("true if results are insufficient and another query would help"),
  reasoning: z.string().describe("Brief explanation of why follow-up is or isn't needed"),
  suggestedQuery: z.string().optional().describe("If follow-up needed, suggest what additional query could help"),
});

export const queryPlanSchema = z.object({
  queries: z
    .array(
      z.object({
        sql: z.string().describe("The PostgreSQL SELECT query"),
        purpose: z.string().describe("Brief explanation of what this query retrieves (1 sentence)"),
        priority: z
          .number()
          .int()
          .min(1)
          .max(5)
          .describe("1=critical, 2=very important, 3=important, 4=supplementary, 5=optional"),
      }),
    )
    .min(1)
    .max(5)
    .describe("1-5 SQL queries to answer the user's complex multi-part question"),
  reasoning: z.string().describe("Brief explanation of why multiple queries are needed"),
});

export const chartOutputSchema = z.object({
  charts: z.array(
    z.object({
      resultIndex: z
        .number()
        .int()
        .min(0)
        .describe(
          "Index of the query result to use for this chart (0-based). Refers to Result 1, Result 2, etc. from the provided results.",
        ),
      config: configSchema.describe("Chart configuration including type, axes, and color palette"),
      reasoning: z
        .string()
        .describe("Brief explanation of why this chart type, configuration, and color palette was chosen"),
    }),
  ),
  summary: z
    .string()
    .optional()
    .describe(
      "Overall summary of chart generation decision (e.g., 'Generated 2 charts to show trends and comparisons' or 'No charts generated - data not suitable for visualization')",
    ),
});

export type ChartGeneratorResult = z.infer<typeof chartOutputSchema>;

export const unifiedRouterSchema = z.object({
  queryType: z
    .enum(["information", "general"])
    .describe("information: needs database query; general: conversational/explanatory"),
  queries: z
    .array(
      z.object({
        sql: z.string().describe("The PostgreSQL SELECT query"),
        purpose: z.string().describe("Brief explanation of what this query retrieves"),
        priority: z.number().int().min(1).max(5).describe("1=critical, 5=optional"),
      }),
    )
    .min(1)
    .max(5)
    .optional()
    .describe("SQL queries (only when queryType is 'information')"),
  reasoning: z.string().describe("Brief explanation of routing decision and query plan"),
});

export type UnifiedRouterResult = z.infer<typeof unifiedRouterSchema>;

export const dataSummarizerSchema = z.object({
  summarySql: z
    .string()
    .describe(
      "A PostgreSQL SELECT query that wraps the original SQL as a subquery and produces aggregated summary results (max 30 rows)",
    ),
  reasoning: z.string().describe("Brief explanation of the aggregation strategy chosen"),
});
