"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat, useChatMessages } from "@ai-sdk-tools/store";
import { AIDevtools } from "@ai-sdk-tools/devtools";

import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { createTracingTransport } from "@/lib/tracing-chat-transport";
import { TraceIdProvider } from "@/lib/trace-id-context";
import type { MyMessage } from "@/app/api/chat/police/route";

interface ChatProps {
  chatPath?: string;
}

export function Chat({ chatPath = "/api/chat/school" }: ChatProps) {
  const [traceIds, setTraceIds] = useState<Map<string, string>>(new Map());
  const pendingTraceIdRef = useRef<string | null>(null);

  const handleTraceId = useCallback((traceId: string | null) => {
    if (traceId) {
      pendingTraceIdRef.current = traceId;
    }
  }, []);

  const transport = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- ref is only written in callback, not read during render
      createTracingTransport({
        api: chatPath,
        onTraceId: handleTraceId,
      }),
    [chatPath, handleTraceId],
  );

  useChat({ transport });

  const messages = useChatMessages<MyMessage>();

  useEffect(() => {
    const pending = pendingTraceIdRef.current;
    if (!pending) return;

    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistantMessage) return;

    if (!traceIds.has(lastAssistantMessage.id)) {
      setTraceIds((prev) => {
        const next = new Map(prev);
        next.set(lastAssistantMessage.id, pending);
        return next;
      });
      pendingTraceIdRef.current = null;
    }
  }, [messages, traceIds]);

  const getTraceIdForMessage = useCallback((messageId: string) => traceIds.get(messageId), [traceIds]);

  const contextValue = useMemo(() => ({ getTraceIdForMessage }), [getTraceIdForMessage]);

  return (
    <TraceIdProvider value={contextValue}>
      <div className="max-w-4xl mx-auto p-6 relative size-full h-screen overflow-hidden">
        <div className="flex flex-col h-full">
          <ChatMessage />
          <div className="mt-4">
            <ChatInput />
          </div>
        </div>
        {process.env.NODE_ENV === "development" && <AIDevtools />}
      </div>
    </TraceIdProvider>
  );
}
