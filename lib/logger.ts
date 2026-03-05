import pino from "pino";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Get color for log level
const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "trace":
      return colors.gray;
    case "debug":
      return colors.cyan;
    case "info":
      return colors.green;
    case "warn":
      return colors.yellow;
    case "error":
      return colors.red;
    case "fatal":
      return colors.red + colors.bright;
    default:
      return colors.reset;
  }
};

// Custom stream for pretty printing in development
const prettyStream = {
  write: (msg: string) => {
    try {
      const obj = JSON.parse(msg) as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { level, time, pid, hostname, msg: message, ...rest } = obj;

      const levelNum = obj.level as number;
      const levelStr =
        levelNum === 10
          ? "trace"
          : levelNum === 20
            ? "debug"
            : levelNum === 30
              ? "info"
              : levelNum === 40
                ? "warn"
                : levelNum === 50
                  ? "error"
                  : "fatal";

      const levelColor = getLevelColor(levelStr);
      const levelDisplay = levelStr.toUpperCase();

      // Build minimal log line: LEVEL message {data}
      const parts = [`${levelColor}${levelDisplay}${colors.reset}`];

      if (message) {
        parts.push(`${message}`);
      }

      // Inline additional properties on same line
      if (Object.keys(rest).length > 0) {
        parts.push(`${colors.dim}${JSON.stringify(rest)}${colors.reset}`);
      }

      console.log(parts.join(" "));
    } catch {
      // Fallback to regular output if parsing fails
      process.stdout.write(msg);
    }
  },
};

// Simple browser/Next.js compatible logger
// In development, logs are formatted for readability with colors
// In production, logs are JSON structured for log aggregation
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  process.env.NODE_ENV === "development" ? prettyStream : pino.destination(1),
);
