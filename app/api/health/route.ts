import { Pool } from "pg";

const healthPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const checkDb = searchParams.get("db") === "true";

  if (!checkDb) {
    return Response.json({ status: "ok" });
  }

  try {
    const client = await healthPool.connect();
    try {
      await client.query("SELECT 1");
      return Response.json({ status: "ok", db: "connected" });
    } finally {
      client.release();
    }
  } catch {
    return Response.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
