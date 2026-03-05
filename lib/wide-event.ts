import packageJson from "@/package.json";

type EnvironmentContext = {
  serviceName: string;
  serviceVersion: string;
  nodeVersion: string;
  environment: string;
};

const ENV_CONTEXT: EnvironmentContext = {
  serviceName: "chat-with-data",
  serviceVersion: packageJson.version,
  nodeVersion: process.version,
  environment: process.env.NODE_ENV ?? "development",
};

export type WideEvent = {
  requestId: string;
  sessionId: string;
  traceId: string;
  durationMs?: number;
  messageCount?: number;

  http?: { method: string; path: string; statusCode?: number };
  client?: { ip?: string; userAgent?: string };

  guardrail?: { isSafe: boolean; category?: string; confidence?: number };

  routing?: { queryType: string; queryCount: number; reasoning: string };

  execution?: {
    resultCount: number;
    successCount: number;
    failureCount: number;
    queries: Array<{
      queryId: string;
      purpose: string;
      success: boolean;
      rowCount?: number;
      executionTimeMs?: number;
      error?: string;
    }>;
  };

  synthesis?: {
    totalResults: number;
    hasFollowUp: boolean;
    reasoning?: string;
  };

  charts?: { count: number; state: string };

  outcome: "success" | "guardrail_blocked" | "error";
  error?: { message: string; type?: string; stack?: string };
};

type WideEventInternal = WideEvent & {
  _startTime: number;
  _env: EnvironmentContext;
};

export function createWideEvent(requestId: string, sessionId: string, traceId: string): WideEventInternal {
  return {
    requestId,
    sessionId,
    traceId,
    _startTime: Date.now(),
    _env: ENV_CONTEXT,
    outcome: "success",
  };
}

export function finalizeEvent(event: WideEventInternal): Record<string, unknown> {
  const { _startTime, _env, ...rest } = event;
  return { ...rest, ..._env, durationMs: Date.now() - _startTime };
}
