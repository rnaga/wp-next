import { notFound } from "next/navigation";

import { logger } from "@rnaga/wp-next-core/server/utils";
import { isValidPublicSlug } from "@rnaga/wp-next-editor/lexical/validate-slug";
import WPPage from "@rnaga/wp-next-editor/server/components/WPPage";

export default async function (props: {
  params: Promise<{ templateSlug: string }>;
  searchParams?: Promise<Record<string, string>>;
}) {
  const templateSlug = (await props.params).templateSlug;
  const searchParams = await props.searchParams;

  if (!isValidPublicSlug(templateSlug)) {
    logger.debug(`Invalid public template slug page.tsx: ${templateSlug}`);
    return notFound();
  }

  return <WPPage idOrSlug={templateSlug} searchParams={searchParams} />;
}
