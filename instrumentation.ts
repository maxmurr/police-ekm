import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
  const hasSecretKey = !!process.env.LANGFUSE_SECRET_KEY;
  const hasPublicKey = !!process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASEURL;

  console.log(
    `[instrumentation] Langfuse config: secretKey=${hasSecretKey}, publicKey=${hasPublicKey}, baseUrl=${baseUrl ?? "not set"}`,
  );

  if (!hasSecretKey || !hasPublicKey) {
    console.warn("[instrumentation] Langfuse tracing disabled — missing credentials");
    return;
  }

  registerOTel({
    serviceName: "chat-with-data",
    traceExporter: new LangfuseExporter({
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      baseUrl,
    }),
  });

  console.log("[instrumentation] Langfuse tracing enabled");
}
