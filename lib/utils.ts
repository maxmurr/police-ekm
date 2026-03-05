import type { MyMessage } from "@/app/api/chat/police/route";
import type { ChatStatus } from "ai";
import { encode } from "@toon-format/toon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMostRecentUserMessage(messages: MyMessage[]) {
  const userMessages = messages.filter((message) => message.role === "user");
  return userMessages.at(-1);
}

export function shouldShowLoadingShimmer(status: ChatStatus, messages: MyMessage[]): boolean {
  if (status === "submitted") return true;

  if (status === "streaming") {
    const lastAssistant = messages.findLast((m) => m.role === "assistant");
    if (!lastAssistant) return true;

    const hasContent = lastAssistant.parts.some(
      (part) => (part.type === "text" || part.type === "reasoning") && part.text.length > 0,
    );

    return !hasContent;
  }

  return false;
}

export function validateSQLQuery(sqlQuery: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedQuery = sqlQuery.trim().toLowerCase();

  // Remove comments and string literals to avoid false positives
  const sanitizedQuery = trimmedQuery
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/'[^']*'/g, "''"); // Replace string literals with empty strings

  // Check if query starts with WITH (CTE) or SELECT
  const startsWithValidStatement =
    sanitizedQuery.trimStart().startsWith("with") || sanitizedQuery.trimStart().startsWith("select");

  if (!startsWithValidStatement) {
    return {
      isValid: false,
      error: "Security violation: Only SELECT queries (including CTEs with WITH) are allowed.",
    };
  }

  // Block dangerous write/DDL operations (using word boundaries to avoid false positives)
  const dangerousPatterns = [
    /\b(drop|delete|insert|update|alter|truncate|create|grant|revoke)\b/i,
    /\binto\s+(outfile|dumpfile)\b/i, // Prevent file writes
    /\bload\s+data\b/i, // Prevent data loading
    /\bcopy\s+.*\bto\b/i, // Prevent COPY to file
  ];

  const hasDangerousOperation = dangerousPatterns.some((pattern) => pattern.test(sanitizedQuery));

  if (hasDangerousOperation) {
    return {
      isValid: false,
      error: "Security violation: Detected unsafe SQL operation. Only read-only SELECT queries are allowed.",
    };
  }

  return { isValid: true };
}

export function convertToTOON(data: unknown[]): string {
  if (!data || data.length === 0) {
    return "No results found";
  }

  return encode(data);
}

/**
 * Check if query results are empty or meaningless
 */
export function isQueryResultEmpty(data: unknown[] | undefined): boolean {
  if (!data || data.length === 0) {
    return true;
  }

  // Check if all rows have only null values
  const allNull = data.every((row) => {
    const rowData = row as Record<string, unknown>;
    return Object.values(rowData).every((val) => val === null || val === undefined);
  });

  return allNull;
}

/**
 * Format multiple query results for the information agent
 */
export function formatMultipleResultsForAgent(
  results: Array<{
    purpose: string;
    data?: unknown[];
    success: boolean;
    error?: string;
  }>,
): string {
  const sections = results.map((result, index) => {
    const header = `--- Query ${index + 1}: ${result.purpose} ---`;

    if (!result.success) {
      return `${header}\nStatus: Failed\nError: ${result.error || "Unknown error"}`;
    }

    if (isQueryResultEmpty(result.data)) {
      return `${header}\nStatus: Success\nResults: No data found`;
    }

    const toon = convertToTOON(result.data || []);
    return `${header}\nStatus: Success\nResults (TOON format):\n${toon}`;
  });

  return sections.join("\n\n");
}

/**
 * Merge query results into a summary object
 */
export function mergeQueryResults(results: Array<{ purpose: string; data?: unknown[]; success: boolean }>): {
  totalQueries: number;
  successfulQueries: number;
  totalRows: number;
  allData: unknown[][];
} {
  return {
    totalQueries: results.length,
    successfulQueries: results.filter((r) => r.success).length,
    totalRows: results.reduce((sum, r) => sum + (r.data?.length || 0), 0),
    allData: results.map((r) => r.data || []),
  };
}

export const createCompactTickFormatter =
  () =>
  (value: number): string => {
    // Handle floating-point precision issues by rounding to 10 decimal places
    const roundedValue = Math.round(value * 1e10) / 1e10;

    // Handle large numbers with compact notation
    const absValue = Math.abs(roundedValue);
    if (absValue >= 1_000_000_000_000) {
      return `${(roundedValue / 1_000_000_000_000).toFixed(1)}T`;
    }
    if (absValue >= 1_000_000_000) {
      return `${(roundedValue / 1_000_000_000).toFixed(1)}B`;
    }
    if (absValue >= 1_000_000) {
      return `${(roundedValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${(roundedValue / 1000).toFixed(0)}k`;
    }

    // For small numbers, use appropriate decimal places
    if (absValue > 0 && absValue < 1) {
      // For decimals less than 1, show up to 2 decimal places
      return roundedValue.toFixed(2);
    }

    // For whole numbers or small decimals, show up to 1 decimal place
    if (Number.isInteger(roundedValue)) {
      return roundedValue.toString();
    }

    return roundedValue.toFixed(1);
  };

export const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

export const formatNumber = (value: number): string => {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

export function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSQL(sql: string): string {
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "JOIN",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "AND",
    "OR",
  ];

  let formatted = sql.trim();

  keywords.forEach((kw) => {
    const regex = new RegExp(`\\s+${kw}\\s+`, "gi");
    formatted = formatted.replace(regex, `\n${kw} `);
  });

  return formatted;
}
