export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  module?: string;
  requestId?: string;
  merchantId?: string;
  disputeId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel: LogLevel =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in LOG_LEVELS
    ? (process.env.LOG_LEVEL as LogLevel)
    : process.env.NODE_ENV === "production"
    ? "info"
    : "debug";

function shouldLog(level: LogLevel): boolean {
  // In automated test environments, suppress verbose debug/info logs unless DEBUG=true
  if (process.env.VITEST === "true" && process.env.DEBUG !== "true" && level !== "error") {
    return false;
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const moduleTag = context?.module ? `[${context.module}] ` : "";
  const reqTag = context?.requestId ? `(req:${context.requestId}) ` : "";
  const durationTag = context?.durationMs !== undefined ? ` +${context.durationMs}ms` : "";

  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${moduleTag}${reqTag}${message}${durationTag}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (shouldLog("debug")) {
      console.debug(formatLogMessage("debug", message, context), context ? sanitizeContext(context) : "");
    }
  },

  info(message: string, context?: LogContext) {
    if (shouldLog("info")) {
      console.info(formatLogMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    if (shouldLog("warn")) {
      console.warn(formatLogMessage("warn", message, context), context ? sanitizeContext(context) : "");
    }
  },

  error(message: string, error?: unknown, context?: LogContext) {
    if (shouldLog("error")) {
      const errMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
      const fullMessage = errMessage ? `${message} — ${errMessage}` : message;
      console.error(formatLogMessage("error", fullMessage, context), error instanceof Error && error.stack ? error.stack : error);
    }
  },
};

/**
 * Strips or masks sensitive credentials (API keys, secrets) from log context.
 */
function sanitizeContext(context: LogContext): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("secret") ||
      lowerKey.includes("key") ||
      lowerKey.includes("password") ||
      lowerKey.includes("authorization")
    ) {
      sanitized[key] = typeof value === "string" && value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export default logger;
