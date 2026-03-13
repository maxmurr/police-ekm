import { NextRequest } from "next/server";
import db from "@/lib/db";
import { sql } from "drizzle-orm";
import { getCachedResult, cacheQueryResult } from "@/lib/cache/query-result-cache";
import { validateSQLQuery } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  if (!key.startsWith("qrc_")) {
    return Response.json({ error: "invalid_key" }, { status: 400 });
  }

  try {
    const cached = await getCachedResult(key);

    if (cached) {
      return Response.json(
        { data: cached.data, metadata: cached.metadata },
        {
          headers: {
            "Cache-Control": "private, max-age=3600",
          },
        },
      );
    }

    const sqlParam = req.nextUrl.searchParams.get("sql");

    if (!sqlParam) {
      return Response.json({ error: "cache_expired" }, { status: 404 });
    }

    const validation = validateSQLQuery(sqlParam);
    if (!validation.isValid) {
      logger.warn({ error: validation.error }, "chart-data: invalid SQL in re-execution request");
      return Response.json({ error: "invalid_sql" }, { status: 400 });
    }

    const dbResult = await db.execute(sql.raw(sqlParam));

    const { metadata } = await cacheQueryResult({
      data: dbResult.rows,
      sql: sqlParam,
      purpose: "re-executed from cache miss",
    });

    return Response.json(
      { data: dbResult.rows, metadata },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      },
    );
  } catch (error) {
    logger.error({ error, key }, "chart-data: failed to serve chart data");
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
