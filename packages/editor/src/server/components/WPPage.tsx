"use server";

import { notFound } from "next/navigation";

import { WPProvider } from "@rnaga/wp-next-core/client/wp";
import { getLoggingConfig } from "@rnaga/wp-next-core/server/utils/logger";

import { logger } from "../../lexical/logger";
import { Decorators } from "../../lexical/nodes/react-decorator/client/Decorators";
import { HtmlInjector } from "../../lexical/resource-loader/server";
import { getWpPage } from "../get-wp-page";
import WPError from "./WPError";

import type * as types from "../../types";
/**
 * WPPage - Server-side component for rendering WordPress pages using Lexical editor templates.
 * See {@link types.WpPageArgs} for prop documentation.
 */
export default async function WPPage(props: types.WpPageArgs) {
  const result = await getWpPage({
    idOrSlug: props.idOrSlug,
    params: props.params,
    searchParams: props.searchParams,
    urlQuery: props.urlQuery,
    previewInfoKey: props.previewInfoKey,
  });

  if (result.valid === false) {
    if (result.statusType === "NOT_FOUND") {
      logger.debug(`WPPage not found for template slug: ${props.idOrSlug}`);
      return notFound();
    }
    return <WPError statusType={result.statusType} error={result.message} />;
  }

  const htmlString = result.htmlString;

  return (
    <WPProvider logging={getLoggingConfig()}>
      <HtmlInjector
        html={[{ title: "page", content: htmlString }]}
        injectCustomCodeAttribute={false}
      />

      {/* Render decorators (interactive components) */}
      <Decorators isEditing={false} />
    </WPProvider>
  );
}
