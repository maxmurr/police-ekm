import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  pruneMessages,
} from "ai";
import { trace } from "@opentelemetry/api";
import { getMostRecentUserMessage, formatMultipleResultsForAgent } from "@/lib/utils";
import {
  unifiedRouter,
  queryExecutor,
  resultSynthesizer,
  shouldSkipCompletenessEvaluation,
  chartGenerator,
} from "@/lib/ai/police";
import { streamInformationAgent, streamGeneralAgent } from "@/lib/ai/police/agents";
import { Config, Result } from "@/lib/types";
import { logger } from "@/lib/logger";
import { inputGuardrail } from "@/lib/ai/input-guardrail";
import { createWideEvent, finalizeEvent } from "@/lib/wide-event";

export const maxDuration = 300;

const MAX_CONTEXT_MESSAGES = 5;

export type QueryExecutionUpdate = {
  queryId: string;
  sql: string;
  purpose: string;
  state: "running" | "completed" | "error";
  data?: unknown[];
  error?: string;
  executionTimeMs?: number;
};

export type ChartGenerationStatus = {
  state: "generating" | "completed" | "skipped";
};

export type MyMessage = UIMessage<{
  handoff: "information" | "general";
  "generate-chart": {
    config: Config;
    data: Result[];
  };
  "query-execution": QueryExecutionUpdate;
  "chart-generation-status": ChartGenerationStatus;
}>;

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const traceId = trace.getActiveSpan()?.spanContext().traceId ?? "";
  const url = new URL(req.url);

  const json = (await req.json()) as { messages: MyMessage[]; id: string };

  const messages: MyMessage[] = json.messages;

  const prunedMessages = pruneMessages({
    messages: (await convertToModelMessages(messages)).slice(-MAX_CONTEXT_MESSAGES),
    reasoning: "all",
    toolCalls: "all",
    emptyMessages: "remove",
  });

  const latestMessage = getMostRecentUserMessage(messages);
  if (!latestMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const userText = latestMessage.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join(" ");

  const sessionId = json.id || `session-${Date.now()}`;
  const event = createWideEvent(requestId, sessionId, traceId);
  event.messageCount = messages.length;
  event.http = { method: req.method, path: url.pathname };
  event.client = {
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
  const requestLogger = logger.child({ requestId, sessionId, traceId });

  const emitEvent = (statusCode: number) => {
    if (event.http) event.http.statusCode = statusCode;
    requestLogger.info(finalizeEvent(event), "request completed");
  };

  try {
    const stream = createUIMessageStream<MyMessage>({
      execute: async ({ writer }) => {
        const guardrailResult = await inputGuardrail(userText);

        if (!guardrailResult?.isSafe) {
          event.guardrail = {
            isSafe: false,
            category: guardrailResult?.category,
            confidence: guardrailResult?.confidence,
          };
          event.outcome = "guardrail_blocked";

          const partId = crypto.randomUUID();
          const violationMessage = `I'm unable to process this request. ${guardrailResult?.reasoning ?? "Your message was flagged by our safety system."}`;

          writer.write({ type: "text-start", id: partId });
          writer.write({
            type: "text-delta",
            id: partId,
            delta: violationMessage,
          });
          writer.write({ type: "text-end", id: partId });
          emitEvent(200);
          return;
        }

        event.guardrail = { isSafe: true };

        const routerResult = await unifiedRouter({
          messages: prunedMessages,
        });
        event.routing = {
          queryType: routerResult.queryType,
          queryCount: routerResult.queries.length,
          reasoning: routerResult.reasoning,
        };

        let streamTextResult: ReturnType<typeof streamInformationAgent>;

        if (routerResult.queryType === "information") {
          const userMessage = JSON.stringify(latestMessage);

          const handleQueryUpdate = (update: QueryExecutionUpdate) => {
            writer.write({
              type: "data-query-execution",
              data: update,
            });
          };

          try {
            const queryResults = await queryExecutor({
              queries: routerResult.queries,
              onQueryUpdate: handleQueryUpdate,
            });
            event.execution = {
              resultCount: queryResults.length,
              successCount: queryResults.filter((r) => r.success).length,
              failureCount: queryResults.filter((r) => !r.success).length,
              queries: queryResults.map((r, i) => ({
                queryId: `SQL-${i + 1}`,
                purpose: r.purpose,
                success: r.success,
                rowCount: r.data?.length,
                executionTimeMs: r.executionTimeMs,
                error: r.error,
              })),
            };

            let finalResults = queryResults;
            if (!shouldSkipCompletenessEvaluation(queryResults)) {
              const synthesizedResults = await resultSynthesizer({
                results: queryResults,
                originalQuestion: userMessage,
                messages: prunedMessages,
                onQueryUpdate: handleQueryUpdate,
              });
              finalResults = synthesizedResults.allResults;
              event.synthesis = {
                totalResults: finalResults.length,
                hasFollowUp: !!synthesizedResults.followUpQuery,
                reasoning: synthesizedResults.summary,
              };
            }

            const formattedResults = formatMultipleResultsForAgent(finalResults);

            streamTextResult = streamInformationAgent({
              prompt: `
                User Question:
                ${userMessage}

                Data Retrieval Results:
                ${formattedResults}

                Please analyze these results and provide a comprehensive, user-friendly response that answers all parts of the user's question.
                Synthesize information from all queries to give a complete answer.
              `,
            });

            const agentStream = streamTextResult.toUIMessageStream({
              sendStart: false,
              sendReasoning: false,
            });

            for await (const chunk of agentStream) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              writer.write(chunk as any);
            }

            writer.write({
              type: "data-chart-generation-status",
              data: { state: "generating" },
            });

            const chartGeneratorResult = await chartGenerator({
              results: finalResults,
              userQuestion: userMessage,
            });

            if (chartGeneratorResult.charts.length > 0) {
              for (const chart of chartGeneratorResult.charts) {
                writer.write({
                  type: "data-generate-chart",
                  data: chart,
                });
              }
              writer.write({
                type: "data-chart-generation-status",
                data: { state: "completed" },
              });
              event.charts = {
                count: chartGeneratorResult.charts.length,
                state: "completed",
              };
            } else {
              writer.write({
                type: "data-chart-generation-status",
                data: { state: "skipped" },
              });
              event.charts = { count: 0, state: "skipped" };
            }

            emitEvent(200);
            return;
          } catch (error) {
            event.outcome = "error";
            event.error = {
              message: error instanceof Error ? error.message : String(error),
              type: "query_execution",
              stack: error instanceof Error ? error.stack : undefined,
            };

            streamTextResult = streamInformationAgent({
              prompt: `
                User Question:
                ${userMessage}

                Error: The query execution encountered an error: ${
                  error instanceof Error ? error.message : String(error)
                }

                Please provide a helpful response explaining what went wrong and suggest how the user might rephrase their question.
              `,
            });
          }
        } else {
          streamTextResult = streamGeneralAgent({
            messages: prunedMessages,
          });
        }

        writer.merge(
          streamTextResult.toUIMessageStream({
            sendStart: false,
            sendReasoning: false,
          }),
        );

        emitEvent(200);
      },
      onError: (error) => {
        event.outcome = "error";
        event.error = {
          message: error instanceof Error ? error.message : String(error),
          type: "stream",
          stack: error instanceof Error ? error.stack : undefined,
        };
        emitEvent(500);
        return "Internal Server Error";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "X-Trace-Id": traceId },
    });
  } catch (error) {
    event.outcome = "error";
    event.error = {
      message: error instanceof Error ? error.message : String(error),
      type: "request",
      stack: error instanceof Error ? error.stack : undefined,
    };
    emitEvent(500);
    return new Response("Internal Server Error", { status: 500 });
  }
}
