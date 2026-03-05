"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Config, Result } from "@/lib/types";
import { transformDataForMultiLineChart } from "@/lib/rechart-format";
import { createCompactTickFormatter, formatNumber, toTitleCase } from "@/lib/utils";
import { useChartPalette, type PaletteName } from "@/hooks/use-chart-palette";

/**
 * Props for the DynamicChart component
 *
 * @example
 * ```tsx
 * // Use default "orchid" palette
 * <DynamicChart data={chartData} config={chartConfig} />
 *
 * // Use a specific palette
 * <DynamicChart data={chartData} config={chartConfig} paletteName="ocean" />
 * ```
 *
 * Available palettes: "ocean", "orchid", "emerald", "spectrum", "sunset", "vivid"
 */
interface DynamicChartProps {
  data: Result[];
  config: Config;
  paletteName?: PaletteName;
}

export function DynamicChart({ data, config, paletteName = "orchid" }: DynamicChartProps) {
  // Helper function to ensure numeric values in data
  const normalizeNumericData = React.useCallback(
    (
      data: Array<Record<string, string | number | null>>,
      keys: string[],
    ): Array<Record<string, string | number | null>> => {
      return data.map((item) => {
        const normalized: Record<string, string | number | null> = { ...item };
        keys.forEach((key) => {
          const value = item[key];
          if (value !== null && value !== undefined) {
            const numValue = typeof value === "number" ? value : Number(value);
            if (isNaN(numValue)) {
              normalized[key] = 0;
            } else {
              // Round decimal numbers to 1 decimal place (e.g., 0.9999999 -> 1.0)
              // For whole numbers, keep them as is
              normalized[key] = Number.isInteger(numValue) ? numValue : Math.round(numValue * 10) / 10;
            }
          }
        });
        return normalized;
      });
    },
    [],
  );

  // Create compact number formatter for axes
  const compactFormatter = React.useMemo(() => createCompactTickFormatter(), []);

  // Determine data length for palette distribution
  const dataLength = React.useMemo(() => {
    if (!data || data.length === 0) return 0;

    if (config.type === "line" && config.multipleLines && config.lineCategories) {
      return config.lineCategories.length;
    }

    if (config.type === "pie") {
      return data.length;
    }

    return config.yKeys.length;
  }, [data, config]);

  // Get distributed colors based on data length
  const chartColors = useChartPalette({
    paletteName,
    dataLength,
  });

  // Prepare chart data and config based on chart type
  const { chartData, chartConfig } = React.useMemo(() => {
    // Handle empty data in useMemo
    if (!data || data.length === 0) {
      return { chartData: [], chartConfig: {} };
    }

    if (config.type === "line" && config.multipleLines) {
      // Transform data for multi-line chart
      const transformed = transformDataForMultiLineChart(data, config);
      const lineConfig: ChartConfig = {};

      transformed.lineFields.forEach((field, index) => {
        lineConfig[field] = {
          label: field,
          color: chartColors[index % chartColors.length],
        };
      });

      return {
        chartData: transformed.data,
        chartConfig: lineConfig,
      };
    }

    // For other chart types, create config from yKeys
    const standardConfig: ChartConfig = {};

    if (config.type === "pie") {
      // For pie charts, map each data point
      data.forEach((item, index) => {
        const key = String(item[config.xKey]);
        standardConfig[key] = {
          label: toTitleCase(key),
          color: chartColors[index % chartColors.length],
        };
      });
    } else {
      // For bar, line, and area charts
      config.yKeys.forEach((key, index) => {
        standardConfig[key] = {
          label: toTitleCase(key),
          color: chartColors[index % chartColors.length],
        };
      });
    }

    return {
      chartData: data,
      chartConfig: standardConfig,
    };
  }, [data, config, chartColors]);

  // Calculate min and max values from chart data for Y-axis domain
  // Skip domain calculation for pie charts (they don't have Y-axis)
  const { minValue, maxValue } = React.useMemo(() => {
    // Pie charts don't need domain calculation
    if (config.type === "pie") {
      return { minValue: 0, maxValue: 100 };
    }

    if (!chartData || chartData.length === 0) {
      return { minValue: 0, maxValue: 100 };
    }

    let min = Infinity;
    let max = -Infinity;

    // Determine which keys to use based on chart type
    const keysToCheck =
      config.type === "line" && config.multipleLines && config.lineCategories ? config.lineCategories : config.yKeys;

    chartData.forEach((dataPoint) => {
      keysToCheck.forEach((key) => {
        const value = dataPoint[key];
        // Handle both numbers and numeric strings (e.g., "55000" or 55000)
        const numValue = typeof value === "number" ? value : Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          min = Math.min(min, numValue);
          max = Math.max(max, numValue);
        }
      });
    });

    // If no valid numbers found, return defaults
    if (min === Infinity || max === -Infinity) {
      return { minValue: 0, maxValue: 100 };
    }

    // If min and max are the same, set a reasonable range
    if (min === max) {
      return { minValue: 0, maxValue: min * 1.5 || 100 };
    }

    // Add 10% padding below min and above max
    const padding = (max - min) * 0.1;
    // Round to avoid floating-point precision issues (e.g., -0.10000000000000009)
    // Use up to 10 decimal places for precision, then remove trailing zeros
    const roundValue = (val: number): number => {
      return Math.round(val * 1e10) / 1e10;
    };

    // Calculate padded min, but ensure it doesn't go below 0 for positive data
    const paddedMin = roundValue(min - padding);
    // If all values are positive (min >= 0), don't let Y-axis go negative
    const finalMin = min >= 0 ? Math.max(0, paddedMin) : paddedMin;

    return {
      minValue: finalMin,
      maxValue: roundValue(max + padding),
    };
  }, [chartData, config.yKeys, config.lineCategories, config.type, config.multipleLines]);

  // Handle empty data - return null to not render anything
  if (!data || data.length === 0 || chartData.length === 0) {
    return null;
  }

  // Check if data has any actual numeric values to display
  const keysToCheck =
    config.type === "line" && config.multipleLines && config.lineCategories ? config.lineCategories : config.yKeys;

  const hasValidData = chartData.some((row) =>
    keysToCheck.some((key) => {
      const value = row[key];
      const numValue = typeof value === "number" ? value : Number(value);
      return !isNaN(numValue) && numValue !== 0;
    }),
  );

  if (!hasValidData) {
    return null;
  }

  // Render appropriate chart based on type
  const renderChart = () => {
    // Normalize numeric data for charts that need it
    const normalizedData =
      config.type === "bar" || config.type === "line" || config.type === "area" || config.type === "pie"
        ? normalizeNumericData(
            chartData,
            config.type === "line" && config.multipleLines && config.lineCategories
              ? config.lineCategories
              : config.yKeys,
          )
        : chartData;

    switch (config.type) {
      case "bar":
        return (
          <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xKey} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={compactFormatter}
              domain={[0, maxValue]}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {config.legend && <ChartLegend content={<ChartLegendContent />} />}
            {config.yKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );

      case "line":
        if (config.multipleLines && config.lineCategories) {
          // Multi-line chart with transformed data
          return (
            <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={config.xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={compactFormatter}
                domain={[minValue, maxValue]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {config.legend && <ChartLegend content={<ChartLegendContent />} />}
              {config.lineCategories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          );
        }

        // Simple line chart
        return (
          <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xKey} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={compactFormatter}
              domain={[minValue, maxValue]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {config.legend && <ChartLegend content={<ChartLegendContent />} />}
            {config.yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={config.xKey} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={compactFormatter}
              domain={[minValue, maxValue]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {config.legend && <ChartLegend content={<ChartLegendContent />} />}
            {config.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={chartColors[index % chartColors.length]}
                stroke={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
                stackId={config.yKeys.length > 1 ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <ChartTooltip content={<ChartTooltipContent />} />
            {config.legend && <ChartLegend content={<ChartLegendContent />} />}
            <Pie
              data={normalizedData}
              dataKey={config.yKeys[0]}
              nameKey={config.xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ value }) => (typeof value === "number" ? formatNumber(value) : value)}
            >
              {normalizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Unsupported chart type: {config.type}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
