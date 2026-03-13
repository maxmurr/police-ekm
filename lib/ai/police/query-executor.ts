import db from "@/lib/db";
import { sql } from "drizzle-orm";
import { validateSQLQuery } from "@/lib/utils";
import { cacheQueryResult } from "@/lib/cache/query-result-cache";
import { logger } from "@/lib/logger";
import { PlannedQuery } from "./query-planner";

const PREVIEW_ROW_LIMIT = 5;

export interface QueryResult {
  sql: string;
  purpose: string;
  priority: number;
  success: boolean;
  data?: unknown[];
  error?: string;
  executionTimeMs?: number;
  cacheKey?: string;
  cacheMetadata?: { columns: string[]; rowCount: number };
}

export interface QueryUpdate {
  queryId: string;
  sql: string;
  purpose: string;
  state: "running" | "completed" | "error";
  previewData?: unknown[];
  cacheKey?: string;
  rowCount?: number;
  columns?: string[];
  error?: string;
  executionTimeMs?: number;
}

interface QueryExecutorOptions {
  queries: PlannedQuery[];
  onQueryUpdate?: (update: QueryUpdate) => void;
}

export async function queryExecutor(opts: QueryExecutorOptions): Promise<QueryResult[]> {
  const { onQueryUpdate } = opts;

  const executionPromises = opts.queries.map(async (query, index) => {
    const queryId = `SQL-${index + 1}`;
    const startTime = Date.now();
    const result: QueryResult = {
      sql: query.sql,
      purpose: query.purpose,
      priority: query.priority,
      success: false,
    };

    onQueryUpdate?.({
      queryId,
      sql: query.sql,
      purpose: query.purpose,
      state: "running",
    });

    try {
      const securityCheck = validateSQLQuery(query.sql);

      if (!securityCheck.isValid) {
        result.error = securityCheck.error || "Security validation failed";
        const executionTime = Date.now() - startTime;
        result.executionTimeMs = executionTime;

        onQueryUpdate?.({
          queryId,
          sql: query.sql,
          purpose: query.purpose,
          state: "error",
          error: result.error,
          executionTimeMs: executionTime,
        });

        return result;
      }

      const dbResult = await db.execute(sql.raw(query.sql));
      result.data = dbResult.rows;
      result.success = true;
      const executionTime = Date.now() - startTime;
      result.executionTimeMs = executionTime;

      try {
        const cached = await cacheQueryResult({
          data: dbResult.rows,
          sql: query.sql,
          purpose: query.purpose,
        });
        result.cacheKey = cached.cacheKey;
        result.cacheMetadata = cached.metadata;
      } catch (cacheError) {
        logger.warn({ error: cacheError, queryId }, "failed to cache query result, continuing without cache");
      }

      const previewData = dbResult.rows.slice(0, PREVIEW_ROW_LIMIT);
      const columns = dbResult.rows.length > 0 ? Object.keys(dbResult.rows[0] as Record<string, unknown>) : [];

      onQueryUpdate?.({
        queryId,
        sql: query.sql,
        purpose: query.purpose,
        state: "completed",
        previewData,
        cacheKey: result.cacheKey,
        rowCount: dbResult.rows.length,
        columns,
        executionTimeMs: executionTime,
      });

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      const executionTime = Date.now() - startTime;
      result.executionTimeMs = executionTime;

      onQueryUpdate?.({
        queryId,
        sql: query.sql,
        purpose: query.purpose,
        state: "error",
        error: result.error,
        executionTimeMs: executionTime,
      });

      return result;
    }
  });

  const results = await Promise.allSettled(executionPromises);

  return results.map((settledResult, index) => {
    if (settledResult.status === "fulfilled") {
      return settledResult.value;
    } else {
      return {
        sql: opts.queries[index].sql,
        purpose: opts.queries[index].purpose,
        priority: opts.queries[index].priority,
        success: false,
        error: `Unexpected execution failure: ${settledResult.reason}`,
      };
    }
  });
}

export async function executeSingleQuery(
  query: PlannedQuery,
  onQueryUpdate?: (update: QueryUpdate) => void,
): Promise<QueryResult> {
  const results = await queryExecutor({ queries: [query], onQueryUpdate });
  return results[0];
}
