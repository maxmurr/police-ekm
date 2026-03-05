import { z } from "zod";

export const resultSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export type Result = z.infer<typeof resultSchema>;

export const configSchema = z
  .object({
    description: z
      .string()
      .describe("Describe the chart. What is it showing? What is interesting about the way the data is displayed?"),
    // takeaway: z.string().describe("What is the main takeaway from the chart?"),
    type: z.enum(["bar", "line", "area", "pie"]).describe("Type of chart"),
    title: z.string(),
    xKey: z.string().describe("Key for x-axis or category"),
    yKeys: z.array(z.string()).describe("Key(s) for y-axis values this is typically the quantitative column"),
    multipleLines: z
      .boolean()
      .describe("For line charts only: whether the chart is comparing groups of data.")
      .optional(),
    measurementColumn: z
      .string()
      .describe("For line charts only: key for quantitative y-axis column to measure against (eg. values, counts etc.)")
      .optional(),
    lineCategories: z
      .array(z.string())
      .describe(
        "For line charts only: Categories used to compare different lines or data series. Each category represents a distinct line in the chart.",
      )
      .optional(),
    legend: z.boolean().default(false).describe("Whether to show legend"),
    paletteName: z
      .enum(["ocean", "orchid", "emerald", "spectrum", "sunset", "vivid"])
      .optional()
      .describe(
        "Color palette for the chart. Choose based on data theme: ocean (blue) for law enforcement, orchid (purple) for special cases, emerald (green) for positive trends, spectrum (blue-red) for severity scales, sunset (purple-yellow) for temporal intensity, vivid (multi-color) for diverse categories.",
      ),
  })
  .describe("Chart configuration object");

export type Config = z.infer<typeof configSchema>;
