import { createContainer } from "@evyweb/ioctopus";
import { DI } from "./tokens";
import type { AIRegistry, GetRetryableModelFn } from "./types";
import { openrouterModule } from "./modules/openrouter";
import { vllmModule } from "./modules/vllm";

const AI_PROVIDER = process.env.AI_PROVIDER ?? "openrouter";

const container = createContainer<AIRegistry>();

switch (AI_PROVIDER) {
  case "vllm":
    container.load(Symbol.for("ai-provider"), vllmModule);
    break;
  case "openrouter":
  default:
    container.load(Symbol.for("ai-provider"), openrouterModule);
    break;
}

export const getRetryableModel: GetRetryableModelFn = (modelId?) => {
  return container.get(DI.GET_RETRYABLE_MODEL)(modelId);
};

export { DI, container };
export type { AIRegistry, GetRetryableModelFn };
