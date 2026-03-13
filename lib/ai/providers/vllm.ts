import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createRetryable, isErrorAttempt, type LanguageModel } from "ai-retry";
import { logger } from "@/lib/logger";
import type { GetRetryableModelFn } from "../container/types";

const VLLM_CHAT_BASE_URL = process.env.VLLM_CHAT_BASE_URL;
const VLLM_CHAT_MODEL = process.env.VLLM_CHAT_MODEL;

const VLLM_GUARDRAIL_BASE_URL = process.env.VLLM_GUARDRAIL_BASE_URL;
const VLLM_GUARDRAIL_MODEL = process.env.VLLM_GUARDRAIL_MODEL;

const VLLM_API_KEY = process.env.VLLM_API_KEY;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 120_000);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 529]);

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (url, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

type VllmEndpoint = {
  baseURL: string;
  provider: ReturnType<typeof createOpenAICompatible>;
};

function buildEndpointMap(): Map<string, VllmEndpoint> {
  const map = new Map<string, VllmEndpoint>();
  const fetchWithTimeout = createTimeoutFetch(AI_TIMEOUT_MS);

  const entries = [
    { model: VLLM_CHAT_MODEL, baseURL: VLLM_CHAT_BASE_URL },
    { model: VLLM_GUARDRAIL_MODEL, baseURL: VLLM_GUARDRAIL_BASE_URL },
  ];

  for (const { model, baseURL } of entries) {
    if (!model || !baseURL) continue;

    map.set(model, {
      baseURL,
      provider: createOpenAICompatible({
        name: `vllm-${model}`,
        baseURL,
        apiKey: VLLM_API_KEY,
        supportsStructuredOutputs: true,
        fetch: fetchWithTimeout,
        transformRequestBody: (body) => ({
          ...body,
          chat_template_kwargs: { enable_thinking: false },
        }),
      }),
    });
  }

  return map;
}

const endpointMap = buildEndpointMap();

export const createVllmRetryableModel: GetRetryableModelFn = (modelId?: string) => {
  const primaryId = modelId ?? VLLM_CHAT_MODEL ?? "default";
  const endpoint = endpointMap.get(primaryId);

  if (!endpoint) {
    throw new Error(
      `vLLM endpoint not configured for model "${primaryId}". ` +
        `Configured models: ${[...endpointMap.keys()].join(", ") || "none"}`,
    );
  }

  return createRetryable<LanguageModel>({
    model: endpoint.provider.chatModel(primaryId),
    retries: [
      (context) => {
        if (!isErrorAttempt(context.current)) return undefined;

        const { error } = context.current;
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
          logger.warn({ modelId: primaryId, statusCode, attempts: context.attempts }, "retrying vllm model call");
          return { model: endpoint.provider.chatModel(primaryId) };
        }

        return undefined;
      },
    ],
  });
};
