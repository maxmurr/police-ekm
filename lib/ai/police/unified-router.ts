import { generateText, ModelMessage, Output } from "ai";
import { getRetryableModel } from "@/lib/ai/container";
import { UNIFIED_ROUTER_SYSTEM_PROMPT } from "./prompts";
import { withBaseContext } from "../base-context";
import { unifiedRouterSchema, type UnifiedRouterResult } from "./schema";
import { PlannedQuery } from "./query-planner";
import { logger } from "@/lib/logger";

interface UnifiedRouterOptions {
  messages: ModelMessage[];
}

export interface RouterResult {
  queryType: "information" | "general";
  queries: PlannedQuery[];
  reasoning: string;
}

const GENERAL_FALLBACK: RouterResult = {
  queryType: "general",
  queries: [],
  reasoning: "Falling back to general agent due to routing failure",
};

export async function unifiedRouter(opts: UnifiedRouterOptions): Promise<RouterResult> {
  const systemPrompt = withBaseContext(UNIFIED_ROUTER_SYSTEM_PROMPT);

  try {
    const { output } = (await generateText({
      model: getRetryableModel(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type incompatibility with AI SDK Output API
      output: Output.object({ schema: unifiedRouterSchema as any }),
      system: systemPrompt,
      messages: opts.messages,
      temperature: 0.1,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "unified-router",
        recordInputs: true,
        recordOutputs: true,
      },
    })) as { output: UnifiedRouterResult };

    const { queryType, queries, reasoning } = output;

    return {
      queryType,
      queries: queries
        ? queries
            .map((q) => ({
              sql: q.sql,
              purpose: q.purpose,
              priority: q.priority,
            }))
            .sort((a, b) => a.priority - b.priority)
        : [],
      reasoning,
    };
  } catch (error) {
    logger.error({ error }, "unified router failed to parse response, falling back to general agent");
    return GENERAL_FALLBACK;
  }
}
