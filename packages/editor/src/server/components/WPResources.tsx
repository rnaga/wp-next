import { headers } from "next/headers";

import { HTML_TO_JSX } from "../../lexical/resource-loader/constants";
import {
  CodeInjector,
  HtmlInjector,
  ScriptInjector,
  StyleInjector,
} from "../../lexical/resource-loader/server";
import { isValidPublicSlug } from "../../lexical/validate-slug";
import * as actionsTemplate from "../actions/template";
import { X_NOT_FOUND_HEADER, X_URL_HEADER } from "../constant";
import {
  getAdminFullPreviewWpPageArgs,
  getPublicWpPageArgs,
} from "../get-wp-page-args";
import { getWpPageResources } from "../get-wp-page-resources";
import { wpGenerateMetadata } from "../wp-generate-metadata";

import type { Metadata } from "next";

import type { GetWpPageResourcesResult } from "../get-wp-page-resources";

type WPResources = GetWpPageResourcesResult;

/**
 * Renders WP head resources: Google Fonts link, inline styles, inline scripts,
 * and header custom code. Intended to be rendered inside <head> in the root layout.
 */
export const WPHeadResources = (props: { resources: WPResources }) => {
  const { resources } = props;

  return (
    <>
      {resources.header.googleFontLink && (
        <link rel="stylesheet" href={resources.header.googleFontLink} />
      )}
      <StyleInjector styles={resources.header.inlineStyles} />
      <ScriptInjector
        scripts={resources.header.inlineScripts}
        options={{ strategy: "beforeInteractive" }}
      />
      {/* Header custom code: expand inline so scripts use beforeInteractive
          (CodeInjector defaults to afterInteractive, which lands at body end) */}
      <StyleInjector styles={resources.header.parsedCustomCode.styles} />
      <ScriptInjector
        scripts={resources.header.parsedCustomCode.scripts}
        options={{ strategy: "beforeInteractive" }}
      />
      <HtmlInjector html={resources.header.parsedCustomCode.html} />
    </>
  );
};

/**
 * Renders WP footer resources: footer custom code.
 * Intended to be placed at the end of the body content.
 */
export const WPFooterResources = (props: { resources: WPResources }) => {
  const { resources } = props;

  return <CodeInjector parsedCode={resources.footer.parsedCustomCode} />;
};

/**
 * Renders Next.js Metadata as raw JSX tags in <head>.
 * Used instead of generateMetadata so that metadata is rendered together
 * with WP resources in a single <head> pass, avoiding streaming delays.
 */
const WPMetaTags = (props: { metadata: Metadata }) => {
  const { metadata } = props;
  const title =
    typeof metadata.title === "string"
      ? metadata.title
      : typeof metadata.title === "object" &&
          metadata.title !== null &&
          "default" in metadata.title
        ? metadata.title.default
        : null;

  return (
    <>
      {title && <title>{title}</title>}
      {metadata.description && (
        <meta name="description" content={metadata.description} />
      )}
      {metadata.keywords &&
        (Array.isArray(metadata.keywords) ? (
          <meta name="keywords" content={metadata.keywords.join(",")} />
        ) : (
          <meta name="keywords" content={metadata.keywords} />
        ))}
      {metadata.other &&
        Object.entries(metadata.other).map(([key, value]) => (
          <meta
            key={key}
            name={key}
            content={Array.isArray(value) ? value.join(",") : `${value}`}
          />
        ))}
    </>
  );
};

/**
 * Async component that resolves BodyNode attributes for the current request
 * and returns them so the root layout can apply them to the <body> tag.
 * Returns null for routes that don't need WP resources.
 */
export const resolveWPBodyAttributes = async (): Promise<Record<
  string,
  string
> | null> => {
  const headersList = await headers();

  // The proxy sets x-not-found when the slug is invalid or unpublished.
  // x-url is not set in that case, so detect 404 first.
  if (headersList.get(X_NOT_FOUND_HEADER) === "1") {
    return resolveErrorPageBodyAttributes();
  }

  const xUrl = headersList.get(X_URL_HEADER) ?? "";
  if (!xUrl) return null;

  let url: URL;
  try {
    url = new URL(xUrl);
  } catch {
    return null;
  }

  const pathname = url.pathname;

  const adminBasePath = process.env.WPAUTH_BASE_PATH ?? "/admin";
  if (pathname.startsWith(adminBasePath)) {
    if (!pathname.includes("/full-preview")) return null;

    const wpPageArgs = await getAdminFullPreviewWpPageArgs(headersList);
    if (!wpPageArgs) return null;

    const wpResources = await getWpPageResources(wpPageArgs).catch(() => null);
    return wpResources?.valid ? wpResources.bodyAttributes : null;
  }

  const wpPageArgs = getPublicWpPageArgs(headersList);
  if (!wpPageArgs) return null;

  if (!isValidPublicSlug(wpPageArgs.idOrSlug)) return null;

  const publishedSlugs = await actionsTemplate.getPublishedSlugs();
  if (
    wpPageArgs.idOrSlug &&
    !publishedSlugs.data?.includes(`${wpPageArgs.idOrSlug}`)
  ) {
    return null;
  }

  const wpResources = await getWpPageResources(wpPageArgs).catch(() => null);
  return wpResources?.valid ? wpResources.bodyAttributes : null;
};

/**
 * Fetches body attributes from the WP 404 error page template.
 * Tries "error-not-found" first, falls back to "error", returns null if both fail.
 */
const resolveErrorPageBodyAttributes = async (): Promise<Record<
  string,
  string
> | null> => {
  for (const slug of ["error-not-found", "error"]) {
    const wpResources = await getWpPageResources({ idOrSlug: slug }).catch(
      () => null
    );

    if (wpResources?.valid) return wpResources.bodyAttributes;
  }
  return null;
};

/**
 * Renders head resources (fonts, styles, scripts) for the WP 404 error page
 * template. Tries "error-not-found" first, falls back to "error". Returns null
 * if both templates fail to load.
 *
 * Used by ResolveWPHeadResources when the middleware sets x-not-found: 1,
 * so that error page scripts are injected from the root layout's <head>
 * rather than from inside WPError. Injecting next/script's <Script> from a
 * page-level server component (WPError) violates the App Router constraint
 * that beforeInteractive scripts must live in layouts, causing a React 19
 * warning during client hydration.
 */
const ErrorPageHeadResources = async () => {
  for (const slug of ["error-not-found", "error"]) {
    const wpResources = await getWpPageResources({ idOrSlug: slug }).catch(
      () => null
    );

    if (wpResources?.valid) {
      return <WPHeadResources resources={wpResources} />;
    }
  }
  return null;
};

/**
 * Async component that resolves WP page resources and metadata for the
 * current request and renders them inside <head> in the root layout.
 *
 * Determines the route type (admin full-preview vs public) from the x-url
 * header, fetches the appropriate resources + metadata, and renders both
 * WPHeadResources and WPMetaTags.
 * Returns null for routes that don't need WP resources (e.g. admin non-preview).
 */
export const ResolveWPHeadResources = async () => {
  const headersList = await headers();

  // For middleware-triggered 404s the proxy sets x-not-found: 1 but does NOT
  // set x-url (since the original URL is irrelevant for a not-found rewrite).
  // Handle this early so the root layout injects the error page's scripts in
  // <head> — avoiding next/script's <Script> being rendered inside WPError
  // (a page-level component), which React 19 warns about during hydration.
  if (headersList.get(X_NOT_FOUND_HEADER) === "1") {
    return <ErrorPageHeadResources />;
  }

  const xUrl = headersList.get(X_URL_HEADER) ?? "";

  if (!xUrl) return null;

  let url: URL;
  try {
    url = new URL(xUrl);
  } catch {
    return null;
  }

  const pathname = url.pathname;

  // Admin full-preview route: /admin/[id]/full-preview/[...rest]
  const adminBasePath = process.env.WPAUTH_BASE_PATH ?? "/admin";
  if (pathname.startsWith(adminBasePath)) {
    if (!pathname.includes("/full-preview")) return null;

    const wpPageArgs = await getAdminFullPreviewWpPageArgs(headersList);
    if (!wpPageArgs) return null;

    const [wpResources, metadata] = await Promise.all([
      getWpPageResources(wpPageArgs).catch(() => null),
      wpGenerateMetadata({
        ...wpPageArgs,
        idOrSlug: `${wpPageArgs.idOrSlug}`,
      }),
    ]);

    return (
      <>
        <WPMetaTags metadata={metadata} />
        {wpResources?.valid && <WPHeadResources resources={wpResources} />}
      </>
    );
  }

  // Public route
  const wpPageArgs = getPublicWpPageArgs(headersList);
  if (!wpPageArgs) return null;

  if (!isValidPublicSlug(wpPageArgs.idOrSlug)) return null;

  const publishedSlugs = await actionsTemplate.getPublishedSlugs();
  if (
    wpPageArgs.idOrSlug &&
    !publishedSlugs.data?.includes(`${wpPageArgs.idOrSlug}`)
  ) {
    return null;
  }

  // Parse sub-paths and search params from the URL for metadata resolution
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const [, ...restPaths] = segments;
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  const [wpResources, metadata] = await Promise.all([
    getWpPageResources(wpPageArgs).catch(() => null),
    wpGenerateMetadata({
      idOrSlug: `${wpPageArgs.idOrSlug}`,
      params: restPaths.length > 0 ? restPaths : undefined,
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
    }),
  ]);

  return (
    <>
      <WPMetaTags metadata={metadata} />
      {wpResources?.valid && <WPHeadResources resources={wpResources} />}
    </>
  );
};

/**
 * Async component that wraps the <body> tag and applies BodyNode attributes
 * (e.g. class, style) resolved from the current WP page template.
 * Intended to replace the bare <body> in the root layout.
 */
export async function WPBodyWithAttributes({
  children,
}: {
  children: React.ReactNode;
}) {
  const bodyAttributes = await resolveWPBodyAttributes();

  const jsxProps: Record<string, string> = {};
  for (const [key, value] of Object.entries(bodyAttributes ?? {})) {
    jsxProps[HTML_TO_JSX[key] ?? key] = value;
  }

  return <body {...jsxProps}>{children}</body>;
}
