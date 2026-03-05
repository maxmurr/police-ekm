import { MessageContent } from "../ai-elements/message";
import { Conversation, ConversationContent, ConversationScrollButton } from "../ai-elements/conversation";
import { Message } from "../ai-elements/message";
import { StreamingResponse } from "../ai-elements/response";
import { useChatError, useChatMessages, useChatStatus } from "@ai-sdk-tools/store";
import { BarChart3, CircleAlert } from "lucide-react";
import { DynamicChart } from "@/components/chat/dynamic-chart";
import { MyMessage, QueryExecutionUpdate, ChartGenerationStatus } from "@/app/api/chat/police/route";
import { Config, Result } from "@/lib/types";
import { useTraceId } from "@/lib/trace-id-context";
import { shouldShowLoadingShimmer } from "@/lib/utils";
import BounceLoader from "./bounce-loader";
import { FeedbackDialog } from "./feedback-dialog";
import { QuerySource } from "./query-source";
import { useGlobalScroll } from "./use-global-scroll";

export function ChatMessage() {
  const messages = useChatMessages<MyMessage>();
  const error = useChatError();
  const status = useChatStatus();
  const { getTraceIdForMessage } = useTraceId();
  useGlobalScroll();

  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.map((message, messageIndex) => {
          // Group query execution parts by queryId to show only latest state
          const queryExecutions = new Map<string, QueryExecutionUpdate>();
          message.parts.forEach((part) => {
            if (part.type === "data-query-execution") {
              const data = part.data as QueryExecutionUpdate;
              queryExecutions.set(data.queryId, data);
            }
          });
          const queryExecutionList = Array.from(queryExecutions.values());
          const hasQueryExecutions = queryExecutionList.length > 0;

          const chartGenPart = message.parts.findLast((p) => p.type === "data-chart-generation-status");
          const chartGenStatus =
            chartGenPart && "data" in chartGenPart ? (chartGenPart.data as ChartGenerationStatus) : undefined;
          const hasCharts = message.parts.some((p) => p.type === "data-generate-chart");
          const showChartLoader = chartGenStatus?.state === "generating" && !hasCharts;

          return (
            <div key={`${message.id}-${messageIndex}`} className="group/message">
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <StreamingResponse text={part.text} isAnimating={status === "streaming"} />
                        </MessageContent>
                      </Message>
                    );
                  case "data-generate-chart": {
                    const chartData = part.data as {
                      config: Config;
                      data: Result[];
                    };

                    return (
                      <div key={`${message.id}-${i}`} className="mt-6 mb-6">
                        <DynamicChart
                          data={chartData.data}
                          config={chartData.config}
                          paletteName={chartData.config.paletteName || "sunset"}
                        />
                      </div>
                    );
                  }
                  default:
                    return null;
                }
              })}
              {showChartLoader && (
                <div className="mt-4 flex animate-pulse items-center gap-2 text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Generating chart...</span>
                </div>
              )}
              {hasQueryExecutions && status !== "streaming" && (
                <QuerySource queries={queryExecutionList.filter((q) => q.state === "completed")} className="mt-4" />
              )}
              {message.role === "assistant" && status !== "streaming" && (
                <div className="mt-3 opacity-0 transition-opacity group-hover/message:opacity-100">
                  <FeedbackDialog traceId={getTraceIdForMessage(message.id)} />
                </div>
              )}
            </div>
          );
        })}
        {shouldShowLoadingShimmer(status, messages) && <BounceLoader />}
        {error && (
          <div className="rounded-md border px-4 py-3">
            <p className="text-sm">
              <CircleAlert className="me-3 -mt-0.5 inline-flex text-red-500" size={16} aria-hidden="true" />
              {error.message ?? "An error occurred!"}
            </p>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
