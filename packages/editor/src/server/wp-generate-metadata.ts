import type * as types from "../types";
import type { Metadata } from "next";
import { $processTemplateText } from "../lexical/nodes/template-text/TemplateTextNode";
import { getWpPage } from "./get-wp-page";
import { isValidPublicSlug } from "../lexical/validate-slug";
import { headers } from "next/headers";
import { X_ADMIN_PAGE_HEADER } from "./constant";

export const wpGenerateMetadata = async (props: {
  idOrSlug: string;
  params?: string[];
  searchParams?: Record<string, string>;
  urlQuery?: types.URLQueryCacheData;
}): Promise<Metadata> => {
  // Check header and see if X_ADMIN_PAGE_HEADER is set. If so, return empty metadata since admin pages don't use WP metadata.
  const headersList = await headers();
  if (headersList.get(X_ADMIN_PAGE_HEADER) === "1") {
    return {};
  }

  if (!isValidPublicSlug(props.idOrSlug)) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }

  const result = await getWpPage({
    idOrSlug: props.idOrSlug,
    params: props.params,
    searchParams: props.searchParams,
    urlQuery: props.urlQuery,
  });

  if (result.valid === false) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }

  const { template, editor } = result;

  const pageMeta = (template.page_meta || {}) as types.TemplatePageMeta;

  const knownMetadataKeys = new Set(["title", "description", "keywords"]);

  const metadata: Metadata = {
    title: "Untitled Page",
    description: "",
  };
  const other: Record<string, string> = {};

  for (const [key, value] of Object.entries(pageMeta)) {
    const processed = editor.read(() => $processTemplateText(value)) as string;

    if (knownMetadataKeys.has(key)) {
      (metadata as Record<string, string>)[key] = processed;
    } else {
      other[key] = processed;
    }
  }

  if (Object.keys(other).length > 0) {
    metadata.other = other;
  }

  return metadata;
};
