import type * as types from "../../types";

/**
 * Module-level logging config populated by WPProvider on mount.
 * Defaults to disabled with the most restrictive log level so that nothing
 * leaks in production unless the server explicitly opts in.
 */
let _loggingEnabled = false;
let _logLevel: types.LogLevel = "error";

/**
 * Sets the client-side logging configuration. Should only be called from
 * WPProvider so that the server-provided values are applied before any
 * component code runs.
 */
export const configureLogging = (
  enabled: boolean,
  level: types.LogLevel
): void => {
  _loggingEnabled = enabled;
  _logLevel = level;
};

/** Returns true when logging has been enabled by the server via WPProvider. */
export const isLoggingEnabled = (): boolean => _loggingEnabled;

const noop = (): void => {};

const levels: types.LogLevel[] = ["debug", "info", "warn", "error"];

/**
 * Client-side logger that preserves the DevTools call-site by returning a
 * directly bound console method rather than wrapping it in another function.
 * When a caller does `logger.log(...)`, DevTools shows that caller's location
 * instead of logging.ts.
 *
 * Standard levels (debug / info / warn / error) are subject to threshold
 * filtering configured via WPProvider. Any method not in the level list is
 * treated as the same threshold as "info".
 *
 * Usage:
 *   logger.log("msg")
 *   logger.warn("something went wrong", obj)
 *   logger.table(data)
 *   logger.trace()
 */
export const logger: Console = new Proxy({} as Console, {
  get(_target, prop: string) {
    if (!_loggingEnabled) {
      return noop;
    }

    const configuredIndex = levels.indexOf(_logLevel);
    const levelIndex = levels.indexOf(prop as types.LogLevel);

    // Unrecognized methods (e.g. log, table, trace) use the same threshold as
    // "info" so they are filtered consistently with it.
    const messageIndex = levelIndex !== -1 ? levelIndex : levels.indexOf("info");

    if (messageIndex < configuredIndex) {
      return noop;
    }

    const method = (console as unknown as Record<string, unknown>)[prop];

    return typeof method === "function" ? method.bind(console) : noop;
  },
});
