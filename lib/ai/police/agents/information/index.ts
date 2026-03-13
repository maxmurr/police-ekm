import { streamText } from "ai";
import { getRetryableModel } from "@/lib/ai/container";
import informationAgentSystemPrompt from "./prompt.md";
import { withBaseContext } from "../../../base-context";

export function streamInformationAgent(opts: { prompt: string }) {
  return streamText({
    model: getRetryableModel(),
    system: withBaseContext(informationAgentSystemPrompt),
    temperature: 0.5,
    prompt: opts.prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "information-agent",
      recordInputs: true,
      recordOutputs: true,
    },
  });
}
