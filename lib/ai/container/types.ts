import type { LanguageModel } from "ai";
import { DI } from "./tokens";

export type GetRetryableModelFn = (modelId?: string) => LanguageModel;

export type AIRegistry = {
  [DI.GET_RETRYABLE_MODEL]: GetRetryableModelFn;
};
