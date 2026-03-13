import { useState, useEffect } from "react";
import type { Result } from "@/lib/types";

interface UseCachedChartDataReturn {
  data: Result[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useCachedChartData(cacheKey: string, sqlQuery: string): UseCachedChartDataReturn {
  const shouldFetch = cacheKey.length > 0;
  const [data, setData] = useState<Result[] | null>(null);
  const [isLoading, setIsLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/chart-data/${cacheKey}?sql=${encodeURIComponent(sqlQuery)}`;
        const response = await fetch(url);

        if (cancelled) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          setError(body.error === "cache_expired" ? "Data is no longer available" : "Failed to load chart data");
          return;
        }

        const result = (await response.json()) as { data: Result[] };
        if (!cancelled) {
          setData(result.data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load chart data");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, sqlQuery, shouldFetch]);

  return { data, isLoading, error };
}
