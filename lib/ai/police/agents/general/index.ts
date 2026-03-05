import { ModelMessage, streamText } from "ai";
import { getRetryableModel } from "../../../openrouter";
import generalAgentSystemPrompt from "./prompt.md";
import { withBaseContext } from "../../../base-context";

export function streamGeneralAgent(opts: { messages: ModelMessage[] }) {
  return streamText({
    model: getRetryableModel(),
    system: withBaseContext(generalAgentSystemPrompt),
    temperature: 0.5,
    messages: opts.messages,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "general-agent",
      recordInputs: true,
      recordOutputs: true,
    },
  });
}
