import db from "@/lib/db";
import { sql } from "drizzle-orm";
import { validateSQLQuery } from "@/lib/utils";
import { PlannedQuery } from "./query-planner";

export interface QueryResult {
  sql: string;
  purpose: string;
  priority: number;
  success: boolean;
  data?: unknown[];
  error?: string;
  executionTimeMs?: number;
}

export interface QueryUpdate {
  queryId: string;
  sql: string;
  purpose: string;
  state: "running" | "completed" | "error";
  data?: unknown[];
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

      onQueryUpdate?.({
        queryId,
        sql: query.sql,
        purpose: query.purpose,
        state: "completed",
        data: dbResult.rows,
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
