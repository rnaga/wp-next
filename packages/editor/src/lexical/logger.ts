import { isClientSide } from "./environment";

/**
 * Isomorphic logging utilities — safe to call from both client and server code.
 *
 * The editor package runs in both environments, so the correct environment-specific
 * logger is loaded via dynamic `require()` at runtime rather than a static import.
 * Static imports would cause the bundler to pull in both client and server modules,
 * breaking server-only APIs (e.g. `process.env`) in the browser and vice versa.
 *
 * On the client, the underlying logger is a Proxy that returns bound console methods,
 * so DevTools call-sites point to the actual caller rather than this file.
 * On the server, messages are prefixed with an ISO timestamp.
 */

export const isLoggingEnabled = (): boolean => {
  if (isClientSide()) {
    return require("@rnaga/wp-next-core/client/utils/logger").isLoggingEnabled();
  }

  return require("@rnaga/wp-next-core/server/utils/logger").isLoggingEnabled();
};

/** Resolves the environment-specific logger at call time to avoid bundling both sides. */
const getLogger = (): Console => {
  if (isClientSide()) {
    return require("@rnaga/wp-next-core/client/utils/logger").logger;
  }

  return require("@rnaga/wp-next-core/server/utils/logger").logger;
};

/**
 * Isomorphic logger with the same API as the core `logger` on both sides.
 * Accessing any property resolves to the env-specific implementation at call time,
 * so `logger.log(...)`, `logger.table(...)`, `logger.trace()`, etc. all work.
 */
export const logger: Console = new Proxy({} as Console, {
  get(_target, prop: string) {
    const envLogger = getLogger() as unknown as Record<string, unknown>;
    const method = envLogger[prop];

    return typeof method === "function" ? method : () => {};
  },
});
