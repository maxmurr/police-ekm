import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createRetryable, isErrorAttempt, type LanguageModel } from "ai-retry";
import { logger } from "@/lib/logger";
import type { GetRetryableModelFn } from "../container/types";

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "qwen/qwen3-vl-30b-a3b-instruct";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 120_000);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 529]);

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.APP_URL ?? "https://police-ekm.localhost",
    "X-Title": process.env.APP_TITLE ?? "Police EKM Chat with Data",
  },
  fetch: async (url, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  },
});

export const createOpenRouterRetryableModel: GetRetryableModelFn = async (modelId?: string) => {
  const primaryId = modelId ?? DEFAULT_MODEL;

  return createRetryable<LanguageModel>({
    model: openrouter.chat(primaryId),
    retries: [
      (context) => {
        if (!isErrorAttempt(context.current)) return undefined;

        const { error } = context.current;
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
          logger.warn({ modelId: primaryId, statusCode, attempts: context.attempts }, "retrying model call");
          return { model: openrouter.chat(primaryId) };
        }

        return undefined;
      },
    ],
  });
};
