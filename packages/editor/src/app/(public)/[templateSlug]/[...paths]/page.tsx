import { notFound } from "next/navigation";

import { isValidPublicSlug } from "@rnaga/wp-next-editor/lexical/validate-slug";
import WPPage from "@rnaga/wp-next-editor/server/components/WPPage";
import { logger } from "@rnaga/wp-next-core/server/utils";

export default async function (props: {
  params: Promise<{ templateSlug: string; paths: string[] }>;
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const templateSlug = params.templateSlug;
  const paths = params.paths;
  const searchParams = await props.searchParams;

  if (!isValidPublicSlug(templateSlug)) {
    logger.debug(`Invalid public template slug path/page.tsx: ${templateSlug}`);
    return notFound();
  }

  return (
    <WPPage
      idOrSlug={templateSlug}
      searchParams={searchParams}
      params={paths}
    />
  );
}
