import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createRetryable, isErrorAttempt, type LanguageModel } from "ai-retry";
import { logger } from "@/lib/logger";

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "qwen/qwen3-vl-30b-a3b-instruct";
const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? "meta-llama/llama-4-maverick";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 120_000);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 529]);

export const openrouter = createOpenRouter({
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

export function getRetryableModel(modelId?: string) {
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
      (context) => {
        if (!isErrorAttempt(context.current)) return undefined;

        logger.warn(
          { primaryModel: primaryId, fallbackModel: FALLBACK_MODEL, attempts: context.attempts },
          "falling back to fallback model",
        );
        return { model: openrouter.chat(FALLBACK_MODEL) };
      },
    ],
  });
}
