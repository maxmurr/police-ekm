"use client";

import { createContext, useContext } from "react";

interface TraceIdContextValue {
  getTraceIdForMessage: (messageId: string) => string | undefined;
}

const TraceIdContext = createContext<TraceIdContextValue>({
  getTraceIdForMessage: () => undefined,
});

export const TraceIdProvider = TraceIdContext.Provider;
export const useTraceId = () => useContext(TraceIdContext);
