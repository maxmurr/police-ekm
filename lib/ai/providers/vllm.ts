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

interface VllmModelsResponse {
  data: Array<{ id: string }>;
}

async function discoverModel(baseURL: string): Promise<string> {
  const url = `${baseURL}/v1/models`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    headers: VLLM_API_KEY ? { Authorization: `Bearer ${VLLM_API_KEY}` } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Failed to discover vLLM models from ${url}: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as VllmModelsResponse;

  if (!body.data?.length) {
    throw new Error(`No models found at ${url}`);
  }

  const modelId = body.data[0].id;
  logger.info({ modelId, baseURL }, "auto-discovered vLLM model");
  return modelId;
}

async function buildEndpointMap(): Promise<Map<string, VllmEndpoint>> {
  const map = new Map<string, VllmEndpoint>();
  const fetchWithTimeout = createTimeoutFetch(AI_TIMEOUT_MS);

  const chatModel = VLLM_CHAT_MODEL ?? (VLLM_CHAT_BASE_URL ? await discoverModel(VLLM_CHAT_BASE_URL) : undefined);

  const entries = [
    { model: chatModel, baseURL: VLLM_CHAT_BASE_URL },
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

let endpointMapPromise: Promise<Map<string, VllmEndpoint>> | null = null;

function getEndpointMap(): Promise<Map<string, VllmEndpoint>> {
  if (!endpointMapPromise) {
    endpointMapPromise = buildEndpointMap();
  }
  return endpointMapPromise;
}

export const createVllmRetryableModel: GetRetryableModelFn = async (modelId?: string) => {
  const endpointMap = await getEndpointMap();
  const primaryId = modelId ?? [...endpointMap.keys()][0] ?? "default";
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
