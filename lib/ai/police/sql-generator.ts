import { generateText, ModelMessage } from "ai";
import { getRetryableModel } from "@/lib/ai/container";
import { SQL_GENERATOR_SYSTEM_PROMPT, formatRetryFeedback } from "./prompts";
import { withBaseContext } from "../base-context";

interface SqlGeneratorOptions {
  messages: ModelMessage[];
  previousAttempt?: string;
  errorFeedback?: string;
  executionError?: string;
}

export async function sqlGenerator(opts: SqlGeneratorOptions): Promise<string> {
  const systemPrompt = withBaseContext(SQL_GENERATOR_SYSTEM_PROMPT);

  const messages: ModelMessage[] = [...opts.messages];
  if (opts.previousAttempt) {
    messages.push({
      role: "user",
      content: formatRetryFeedback({
        previousAttempt: opts.previousAttempt,
        errorFeedback: opts.errorFeedback,
        executionError: opts.executionError,
      }),
    });
  }

  const generateSQLQueryResult = await generateText({
    model: getRetryableModel(),
    system: systemPrompt,
    messages,
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "sql-generator",
      recordInputs: true,
      recordOutputs: true,
    },
  });

  return generateSQLQueryResult.text;
}
