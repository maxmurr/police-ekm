import { getRedis } from "@/lib/redis";
import { generateId } from "@/lib/id";
import { logger } from "@/lib/logger";

const DEFAULT_TTL_SECONDS = 86400; // 24 hours
const CACHE_KEY_PREFIX = "query_result:";

interface CacheQueryResultOptions {
  data: unknown[];
  sql: string;
  purpose: string;
  ttlSeconds?: number;
}

interface CacheMetadata {
  columns: string[];
  rowCount: number;
}

interface CachedQueryResult {
  data: unknown[];
  sql: string;
  purpose: string;
  metadata: CacheMetadata;
}

export async function cacheQueryResult(
  opts: CacheQueryResultOptions,
): Promise<{ cacheKey: string; metadata: CacheMetadata }> {
  const cacheKey = generateId("queryResultCache");
  const metadata: CacheMetadata = {
    columns: opts.data.length > 0 ? Object.keys(opts.data[0] as Record<string, unknown>) : [],
    rowCount: opts.data.length,
  };

  const payload: CachedQueryResult = {
    data: opts.data,
    sql: opts.sql,
    purpose: opts.purpose,
    metadata,
  };

  const ttl = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  await getRedis().set(`${CACHE_KEY_PREFIX}${cacheKey}`, JSON.stringify(payload), "EX", ttl);

  logger.debug({ cacheKey, rowCount: metadata.rowCount, ttl }, "cached query result");

  return { cacheKey, metadata };
}

export async function getCachedResult(cacheKey: string): Promise<CachedQueryResult | null> {
  const raw = await getRedis().get(`${CACHE_KEY_PREFIX}${cacheKey}`);

  if (!raw) {
    logger.debug({ cacheKey }, "cache miss");
    return null;
  }

  return JSON.parse(raw) as CachedQueryResult;
}
