import { TEMPLATE_SLUG_HOMEPAGE } from "../lexical/constants";
import { isValidPageSlug } from "../lexical/validate-slug";
import type * as types from "../types";
import { X_URL_HEADER } from "./constant";

/**
 * Builds WpPageArgs for the public root layout from the current request.
 *
 * The public layout sits above the `[templateSlug]` segment, so Next.js does
 * not pass route params down to it. Instead we read the full URL from the
 * `x-url` request header (set by middleware for all public routes) and parse
 * the pathname and search params ourselves:
 *
 *   /[templateSlug]/[...paths]
 *   /empty-test              → idOrSlug: "empty-test"
 *   /blog/my-post/page/2    → idOrSlug: "blog", params: ["my-post","page","2"]
 */
export const getPublicWpPageArgs = (
  headers: Awaited<ReturnType<typeof import("next/headers").headers>>
): types.WpPageArgs | null => {
  const xUrl = headers.get(X_URL_HEADER) ?? "";
  const url = xUrl ? new URL(xUrl) : null;

  const segments = (url?.pathname ?? "")
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean);
  const [templateSlug, ...restPaths] = segments;

  // If a slug segment is present but contains invalid characters, reject it.
  if (templateSlug && !isValidPageSlug(templateSlug)) {
    return null;
  }

  const searchParams: Record<string, string> = {};
  url?.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  return {
    // No slug means the home/index path (e.g. https://localhost:3000), so default to TEMPLATE_SLUG_HOMEPAGE
    idOrSlug: templateSlug ?? TEMPLATE_SLUG_HOMEPAGE,
    params: restPaths.length > 0 ? restPaths : undefined,
    searchParams:
      Object.keys(searchParams).length > 0 ? searchParams : undefined,
  };
};

/**
 * Builds WpPageArgs from the admin full-preview Next.js route props.
 *
 * The full-preview route is `/admin/[id]/full-preview/[...rest]`.
 * The catch-all `paths` segment therefore looks like
 * `["<id>", "full-preview", ...restPaths]`.
 * `id` and `previewInfoKey` are passed via search params; the remaining
 * search params are forwarded as-is.
 *
 * `params` and `searchParams` are Promises as required by the Next.js App
 * Router — this function awaits them internally.
 *
 * Returns `null` when the required `id` or `previewInfoKey` search params
 * are absent so the caller can render an error response.
 *
 * @param props.params   Next.js params Promise resolving to the `paths` array.
 * @param props.searchParams Next.js search params Promise including `id` and
 *                           `previewInfoKey`.
 */
type AdminFullPreviewRouteProps = {
  params: Promise<{ paths: string[] }>;
  searchParams?: Promise<
    { id?: string; slug?: string; previewInfoKey?: string } & Record<
      string,
      string
    >
  >;
};

type NextHeaders = Awaited<ReturnType<typeof import("next/headers").headers>>;

const isHeaders = (
  v: AdminFullPreviewRouteProps | NextHeaders
): v is NextHeaders => {
  return (
    "get" in v &&
    typeof (v as NextHeaders).get === "function" &&
    !("params" in v)
  );
};

export async function getAdminFullPreviewWpPageArgs(
  props: AdminFullPreviewRouteProps
): Promise<types.WpPageArgs | null>;
export async function getAdminFullPreviewWpPageArgs(
  headers: NextHeaders
): Promise<types.WpPageArgs | null>;
export async function getAdminFullPreviewWpPageArgs(
  propsOrHeaders: AdminFullPreviewRouteProps | NextHeaders
): Promise<types.WpPageArgs | null> {
  // Headers-based overload (used by layouts that lack route params)
  if (isHeaders(propsOrHeaders)) {
    const xUrl = propsOrHeaders.get(X_URL_HEADER) ?? "";
    const url = xUrl ? new URL(xUrl) : null;

    if (!url?.pathname.includes("/full-preview")) return null;

    // Path: /admin/[id]/full-preview/[...rest]
    const segments = url.pathname.replace(/^\//, "").split("/").filter(Boolean);
    // segments: ["admin", "<id>", "full-preview", ...restPaths]
    const [, , , ...restPaths] = segments;

    const id = url.searchParams.get("id");
    const previewInfoKey = url.searchParams.get("previewInfoKey");
    const restSearchParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "id" && key !== "previewInfoKey")
        restSearchParams[key] = value;
    });

    const slug = url.searchParams.get("slug");

    if (slug && !isValidPageSlug(slug)) return null;
    if (!slug && (!id || !previewInfoKey)) return null;

    return {
      idOrSlug: slug ? slug : parseInt(id!, 10),
      params: restPaths,
      searchParams:
        Object.keys(restSearchParams).length > 0 ? restSearchParams : undefined,
      previewInfoKey: previewInfoKey || undefined,
    };
  }

  // Route props-based overload (used by page components)
  const params = await propsOrHeaders.params;
  const searchParams = await propsOrHeaders.searchParams;

  // e.g. paths: ["<id>", "full-preview", ...restPaths]
  const [, , ...restPaths] = params.paths;

  const { id, slug, previewInfoKey, ...restSearchParams } = searchParams ?? {};

  if (slug && !isValidPageSlug(slug)) return null;
  if (!slug && (!id || !previewInfoKey)) {
    return null;
  }

  return {
    idOrSlug: slug ? slug : parseInt(id!, 10),
    params: restPaths,
    searchParams: restSearchParams,
    previewInfoKey: previewInfoKey,
  };
}
