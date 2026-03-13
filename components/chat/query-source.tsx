"use client";

import { useState } from "react";
import { DatabaseIcon, ChevronDownIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Badge } from "@/components/ui/badge";
import { cn, formatSQL } from "@/lib/utils";
import type { QueryExecutionUpdate } from "@/app/api/chat/police/route";

const TABLE_NAME_REGEX = /\bpolice\."?(\w+)"?/gi;

const extractTableNames = (sql: string): string[] => {
  const tables = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = TABLE_NAME_REGEX.exec(sql)) !== null) {
    tables.add(match[1]);
  }
  TABLE_NAME_REGEX.lastIndex = 0;
  return Array.from(tables);
};

const extractColumns = (data: unknown[] | undefined): string[] => {
  if (!data || data.length === 0) return [];
  const first = data[0];
  if (typeof first === "object" && first !== null) {
    return Object.keys(first);
  }
  return [];
};

const PREVIEW_ROW_LIMIT = 5;

const formatCellValue = (value: unknown): string => {
  if (value == null) return "\u2014";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

type QuerySourceProps = {
  queries: QueryExecutionUpdate[];
  className?: string;
};

export const QuerySource = ({ queries, className }: QuerySourceProps) => {
  const [open, setOpen] = useState(false);

  if (queries.length === 0) return null;

  const totalRows = queries.reduce((sum, q) => sum + (q.rowCount ?? 0), 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("not-prose", className)}>
      <CollapsibleTrigger
        className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`ดูที่มาของข้อมูล: ${queries.length} queries, ${totalRows} rows`}
      >
        <DatabaseIcon className="h-3.5 w-3.5" />
        <span className="tabular-nums">
          ดูที่มาของข้อมูล ({queries.length} queries &middot; {totalRows} rows)
        </span>
        <ChevronDownIcon
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200 ease-out motion-reduce:duration-0",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "mt-3 space-y-4",
          "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2",
          "data-[state=open]:slide-in-from-top-2 data-[state=open]:animate-in",
          "data-[state=closed]:animate-out",
          "duration-200 motion-reduce:duration-0",
        )}
      >
        {queries.map((query) => {
          const tables = extractTableNames(query.sql);
          const previewData = query.previewData;
          const columns = query.columns ?? extractColumns(previewData);
          const rowCount = query.rowCount ?? 0;

          return (
            <div key={query.queryId} className="space-y-2">
              <p className="text-xs font-medium">{query.purpose}</p>
              <CodeBlock code={formatSQL(query.sql)} language="sql" />
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{rowCount} rows</Badge>
                {query.executionTimeMs != null && <Badge variant="secondary">{query.executionTimeMs}ms</Badge>}
              </div>
              {tables.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Tables: </span>
                  {tables.map((t, i) => (
                    <span key={t}>
                      <code className="font-mono text-xs">{t}</code>
                      {i < tables.length - 1 && ", "}
                    </span>
                  ))}
                </p>
              )}
              {previewData && columns.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {columns.map((col) => (
                          <th key={col} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium">
                            <code className="font-mono">{col}</code>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(previewData as Record<string, unknown>[]).slice(0, PREVIEW_ROW_LIMIT).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b last:border-b-0">
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="max-w-48 truncate whitespace-nowrap px-2.5 py-1.5 font-mono text-muted-foreground"
                            >
                              {formatCellValue(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rowCount > PREVIEW_ROW_LIMIT && (
                    <p className="border-t bg-muted/30 px-2.5 py-1.5 text-center text-xs text-muted-foreground">
                      +{rowCount - PREVIEW_ROW_LIMIT} more rows
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
};
