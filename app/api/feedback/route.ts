import { z } from "zod";
import { getLangfuse } from "@/lib/langfuse";
import { logger } from "@/lib/logger";
import { createWideEvent, finalizeEvent } from "@/lib/wide-event";

const FeedbackSchema = z.object({
  traceId: z.string().min(1),
  value: z.union([z.literal(0), z.literal(1)]),
  comment: z.string().optional(),
  issueType: z.string().optional(),
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const url = new URL(req.url);
  const event = createWideEvent(requestId, "", "");
  event.http = { method: req.method, path: url.pathname };

  const requestLogger = logger.child({ requestId });

  const emitEvent = (statusCode: number) => {
    if (event.http) event.http.statusCode = statusCode;
    requestLogger.info(finalizeEvent(event), "request completed");
  };

  try {
    const body = await req.json();
    const parsed = FeedbackSchema.safeParse(body);

    if (!parsed.success) {
      event.outcome = "error";
      event.error = { message: "Invalid request body", type: "validation" };
      emitEvent(400);
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { traceId, value, comment, issueType } = parsed.data;

    const langfuse = getLangfuse();
    if (!langfuse) {
      event.outcome = "error";
      event.error = { message: "Langfuse is not configured", type: "dependency" };
      emitEvent(503);
      return Response.json({ error: "Langfuse is not configured" }, { status: 503 });
    }

    const commentParts: string[] = [];
    if (issueType) commentParts.push(`Issue: ${issueType}`);
    if (comment) commentParts.push(comment);

    langfuse.score({
      traceId,
      name: "user-feedback",
      value,
      comment: commentParts.length > 0 ? commentParts.join(" - ") : undefined,
    });

    await langfuse.flushAsync();

    emitEvent(200);
    return Response.json({ success: true });
  } catch (error) {
    event.outcome = "error";
    event.error = {
      message: error instanceof Error ? error.message : String(error),
      type: "request",
      stack: error instanceof Error ? error.stack : undefined,
    };
    emitEvent(500);
    return Response.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
