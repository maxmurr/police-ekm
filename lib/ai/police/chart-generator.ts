import { generateText, Output } from "ai";
import { z } from "zod";
import { getRetryableModel } from "@/lib/ai/container";
import { configSchema } from "@/lib/types";
import { logger } from "@/lib/logger";
import { QueryResult } from "./query-executor";
import { withBaseContext } from "../base-context";
import { CHART_GENERATOR_SYSTEM_PROMPT } from "./prompts";
import { chartOutputSchema, type ChartGeneratorResult } from "./schema";

interface ChartGeneratorOptions {
  results: QueryResult[];
  userQuestion: string;
}

// Extended type for the actual return value with data attached
export type ChartWithData = {
  data: Record<string, string | number>[];
  config: z.infer<typeof configSchema>;
  reasoning: string;
};

export type ChartGeneratorOutput = {
  charts: ChartWithData[];
  summary?: string;
};

export async function chartGenerator(opts: ChartGeneratorOptions): Promise<ChartGeneratorOutput> {
  const systemPrompt = withBaseContext(CHART_GENERATOR_SYSTEM_PROMPT);

  const successfulResults = opts.results.filter((r, index) => {
    if (!r.success || !r.data || r.data.length === 0) {
      logger.debug(
        { resultIndex: index, success: r.success, hasData: !!r.data, rowCount: r.data?.length ?? 0 },
        "chart-generator: filtered out result (no data or failed query)",
      );
      return false;
    }

    const data = r.data as Record<string, string | number>[];

    if (data.length === 1) {
      const keys = Object.keys(data[0]);
      if (keys.length <= 2) {
        logger.debug(
          { resultIndex: index, rowCount: 1, columnCount: keys.length, columns: keys },
          "chart-generator: filtered out result (single row with ≤2 columns)",
        );
        return false;
      }
    }

    if (data.length < 2) {
      logger.debug(
        { resultIndex: index, rowCount: data.length },
        "chart-generator: filtered out result (fewer than 2 rows)",
      );
      return false;
    }

    return true;
  });

  if (successfulResults.length === 0) {
    logger.warn({ totalResults: opts.results.length }, "chart-generator: no results suitable for visualization");
    return {
      charts: [],
      summary:
        "No charts generated - data not suitable for visualization (single aggregate values or insufficient data points)",
    };
  }

  // Prepare formatted results for the agent
  const formattedResults = successfulResults
    .map((result, index) => {
      const data = result.data as Record<string, string | number>[];
      const dataPreview = data.length > 5 ? data.slice(0, 5) : data;

      return `
Result ${index + 1}:
Query: ${result.sql}
Purpose: ${result.purpose}
Rows returned: ${data.length}
Data preview (first 5 rows):
${JSON.stringify(dataPreview, null, 2)}
      `.trim();
    })
    .join("\n\n");

  const prompt = `
User Question:
${opts.userQuestion}

Query Results:
${formattedResults}

Analyze these results and generate appropriate charts to best answer the user's question. Consider:
1. What insights would visualizations provide?
2. What chart types best suit the data structure?
3. What color palettes match the data context and theme?
4. Should you generate 0, 1, 2, or 3 charts?

IMPORTANT: For each chart, specify which result to use via resultIndex:
- Result 1 → use resultIndex: 0
- Result 2 → use resultIndex: 1
- Result 3 → use resultIndex: 2
DO NOT include the data array in your response - the system will attach it automatically.

Return your chart configurations with appropriate color palettes and reasoning.
  `.trim();

  try {
    const generateResult = await generateText({
      model: getRetryableModel(),
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type incompatibility with AI SDK Output API
      output: Output.object({ schema: chartOutputSchema as any }),
      temperature: 0.1,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chart-generator",
        recordInputs: true,
        recordOutputs: true,
      },
    });

    const { output } = generateResult as unknown as { output: ChartGeneratorResult };
    logger.debug(
      {
        step: "chart-generator",
        inputTokens: generateResult.usage.inputTokens,
        outputTokens: generateResult.usage.outputTokens,
        totalTokens: generateResult.usage.totalTokens,
      },
      "ai step completed",
    );

    // Attach the actual data based on resultIndex
    const chartsWithData = output.charts
      .map((chart) => {
        const resultIndex = chart.resultIndex;
        const result = successfulResults[resultIndex];

        if (!result || !result.data) {
          return null;
        }

        return {
          data: result.data as Record<string, string | number>[],
          config: chart.config,
          reasoning: chart.reasoning,
        };
      })
      .filter((chart) => chart !== null);

    return {
      charts: chartsWithData,
      summary: output.summary,
    };
  } catch (error) {
    logger.error({ error }, "chart-generator: failed to generate charts");
    return {
      charts: [],
      summary: "Chart generation failed - returning no charts",
    };
  }
}
