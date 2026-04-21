"use server";

import { headers } from "next/headers";
import { WPProvider } from "@rnaga/wp-next-core/client/wp";
import {
  logger,
  getLoggingConfig,
} from "@rnaga/wp-next-core/server/utils/logger";

import { CACHE_ERROR_DATA_KEY } from "../../lexical/nodes/error-data-fetching/ErrorDataFetchingNode";
import { Decorators } from "../../lexical/nodes/react-decorator/client/Decorators";
import { HtmlInjector } from "../../lexical/resource-loader/server";
import { getWpPage } from "../get-wp-page";
import { getWpPageResources } from "../get-wp-page-resources";
import { WPFooterResources, WPHeadResources } from "./WPResources";

import type * as types from "../../types";
import { X_NOT_FOUND_HEADER } from "../constant";
const staticFallback = (
  <div>
    <h2>An unexpected error occurred</h2>
    <p>Please try again later.</p>
  </div>
);

/**
 * WPError - Server-side component that renders an error page based on the given status type.
 * Fetches the corresponding error page by slug (e.g. "error-not-found"), falling back to the generic
 * "error" page if the specific one is unavailable. Injects WP resources (fonts, styles, scripts) and
 * renders interactive decorators.
 *
 * Does NOT render <html>/<head>/<body> — those are provided by the root layout.
 */
export default async function WPError(props: {
  statusType: types.WPPageStatusType;
  error: string;
}) {
  let pageSlug = "error";

  switch (props.statusType) {
    case "TEMPLATE_ERROR":
      pageSlug = "error-template";
      break;
    case "NOT_FOUND":
      pageSlug = "error-not-found";
      break;
  }

  // Set cacheData for ErrorDataFetchingNode
  const cacheData = {
    [CACHE_ERROR_DATA_KEY]: {
      error_type: props.statusType,
      error_message: props.error,
    },
  };

  logger.debug(
    `Rendering WPError for template slug: ${pageSlug}, statusType: ${props.statusType}, error: ${props.error}`
  );

  const wpPage = await getWpPage({
    idOrSlug: pageSlug,
    cacheData,
  });

  let htmlString = wpPage.valid
    ? wpPage.htmlString
    : "<h1>An unexpected error occurred</h1>";

  if (!wpPage.valid) {
    if (pageSlug === "error") {
      logger.error(`Failed to load the generic error page (${pageSlug}).`);
      return staticFallback;
    }

    // If pageSlug isn't the generic "error" page, attempt to load the generic error page as a fallback.
    // If that also fails, return static fallback to avoid infinite loop.
    const fallbackResult = await getWpPage({
      idOrSlug: "error",
      cacheData,
    });

    if (!fallbackResult.valid) {
      logger.warn(
        `Failed to load both the specific error page (${pageSlug}) and the generic error page.`
      );
      return staticFallback;
    } else {
      logger.warn(
        `Failed to load specific error page (${pageSlug}). Falling back to generic error page.`
      );
    }

    pageSlug = "error";
    htmlString = fallbackResult.htmlString;
  }

  const wpResources = await getWpPageResources({
    idOrSlug: pageSlug,
  }).catch((err) => {
    logger.warn("Error fetching WP page resources in WPError:", err);
    return null;
  });

  if (!wpResources?.valid) {
    logger.warn(
      "No WP resources found for this page. Rendering without WP assets."
    );
    return staticFallback;
  }

  // When the middleware sets x-not-found: 1 (slug not in published list or
  // invalid format), ResolveWPHeadResources in the root layout already loads
  // the error page's head resources and injects them into <head>. In that
  // case, skip WPHeadResources here to avoid rendering next/script's <Script>
  // inside a page-level server component, which React 19 warns about during
  // client hydration (beforeInteractive is only valid in layout files).
  const headersList = await headers();
  const headInjectedByLayout = headersList.get(X_NOT_FOUND_HEADER) === "1";

  return (
    <>
      {!headInjectedByLayout && <WPHeadResources resources={wpResources} />}

      <WPProvider logging={getLoggingConfig()}>
        <HtmlInjector
          html={[{ title: "page", content: htmlString }]}
          injectCustomCodeAttribute={false}
        />
        <Decorators isEditing={false} />
      </WPProvider>

      <WPFooterResources resources={wpResources} />
    </>
  );
}
