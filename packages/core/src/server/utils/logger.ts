import type * as types from "../../types";

/**
 * Returns the logging config derived from server-side env variables.
 * Pass the result directly as the `logging` prop of WPProvider so that
 * client utilities receive the same settings without reading env vars themselves.
 */
export const getLoggingConfig = (): {
  enabled: boolean;
  level: types.LogLevel;
} => ({
  enabled: process.env.WP_ENABLE_LOG === "true",
  level: (process.env.WP_LOG_LEVEL ?? "error") as types.LogLevel,
});

/** Returns true if logging is enabled via the WP_ENABLE_LOG env variable. */
export const isLoggingEnabled = (): boolean => {
  return process.env.WP_ENABLE_LOG === "true";
};

/**
 * Outputs a log message if logging is enabled. Each message is prefixed with
 * an ISO timestamp and the uppercased level tag, e.g.:
 *   [2024-01-01T00:00:00.000Z] [WARN] something went wrong
 *
 * `error` and `warn` are routed to stderr via console.error / console.warn so
 * they show up correctly in log aggregators that split stdout/stderr.
 *
 * Reads WP_LOG_LEVEL from the environment to filter messages — only logs whose
 * level is at or above the configured threshold are emitted.
 *
 * Level order (ascending severity): debug(0) < info(1) < warn(2) < error(3)
 * Console methods not in this list (log, trace, table) are mapped to "info".
 */
const appLog = (level: types.LogLevel, ...args: unknown[]): void => {
  if (!isLoggingEnabled()) {
    return;
  }

  const levels: types.LogLevel[] = ["debug", "info", "warn", "error"];
  const configuredLevel: types.LogLevel = (process.env.WP_LOG_LEVEL ??
    "debug") as types.LogLevel;
  const configuredIndex = levels.indexOf(configuredLevel);
  const messageIndex = levels.indexOf(level);

  // Skip messages below the configured log level threshold
  if (messageIndex < configuredIndex) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (level === "error") {
    console.error(prefix, ...args);
    return;
  }

  if (level === "warn") {
    console.warn(prefix, ...args);
    return;
  }

  console.log(prefix, ...args);
};

/**
 * Server-side logger providing a unified API for all log levels. Standard
 * methods (debug / log / info / warn / error) delegate to `appLog` so they
 * include the ISO timestamp prefix and apply level filtering — identical
 * behaviour to calling appLog directly.
 *
 * Pass-through methods (trace, table, group, dir, …) delegate directly to
 * console without a timestamp prefix because their output format cannot be
 * easily modified, and they are typically used for ad-hoc debugging rather
 * than structured log lines.
 *
 * Usage:
 *   logger.log("msg")
 *   logger.error("failed", err)
 *   logger.table(rows)
 *   logger.trace()
 */
export const logger = {
  debug: (...args: unknown[]): void => appLog("debug", ...args),
  // log is not a named level — mapped to "info" so it respects the info threshold
  log: (...args: unknown[]): void => appLog("info", ...args),
  info: (...args: unknown[]): void => appLog("info", ...args),
  warn: (...args: unknown[]): void => appLog("warn", ...args),
  error: (...args: unknown[]): void => appLog("error", ...args),

  // Filtered at the "info" threshold — suppressed when WP_LOG_LEVEL is above "info"
  trace: (...args: unknown[]): void => appLog("info", ...args),
  table: (...args: unknown[]): void => appLog("info", ...args),
  group: console.group.bind(console),
  groupCollapsed: console.groupCollapsed.bind(console),
  groupEnd: console.groupEnd.bind(console),
  time: console.time.bind(console),
  timeEnd: console.timeEnd.bind(console),
  timeLog: console.timeLog.bind(console),
  dir: console.dir.bind(console),
  count: console.count.bind(console),
  countReset: console.countReset.bind(console),
  assert: console.assert.bind(console),
};
