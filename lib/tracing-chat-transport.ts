import { DefaultChatTransport } from "ai";

export const createTracingTransport = ({
  api,
  onTraceId,
}: {
  api: string;
  onTraceId: (traceId: string | null) => void;
}) =>
  new DefaultChatTransport({
    api,
    fetch: async (input, init) => {
      const response = await globalThis.fetch(input, init);
      onTraceId(response.headers.get("X-Trace-Id"));
      return response;
    },
  });
