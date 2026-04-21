/**
 * HTTP request header names used to pass routing metadata through Next.js
 * middleware (proxy.ts) into server components.
 *
 * Middleware cannot share state with server components directly, so these
 * headers are injected by the middleware and read downstream via
 * `headers()` from `next/headers`.
 */

/**
 * Carries the full request URL (pathname + search params) so that server
 * components inside the public layout can read the current URL, which is
 * not otherwise accessible server-side after a rewrite.
 * Configurable via the `HEADER_X_URL` environment variable.
 */
export const X_URL_HEADER = process.env.HEADER_X_URL ?? "x-url";

/**
 * Set to `"1"` by the middleware for all `/admin/*` routes so that server
 * components (e.g. `wp-generate-metadata`) can skip WP-specific logic that
 * does not apply to admin pages.
 * Configurable via the `HEADER_X_ADMIN_PAGE` environment variable.
 */
export const X_ADMIN_PAGE_HEADER =
  process.env.HEADER_X_ADMIN_PAGE ?? "x-admin-page";

/**
 * Set to `"1"` by the middleware when a request is rewritten to the
 * `/not-found` route (invalid slug or unpublished template). Server
 * components use this flag to suppress normal resource loading and rendering
 * for 404 responses.
 */
export const X_NOT_FOUND_HEADER = "x-not-found";
