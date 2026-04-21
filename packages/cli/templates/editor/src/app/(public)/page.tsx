import { TEMPLATE_SLUG_HOMEPAGE } from "@rnaga/wp-next-editor/lexical/constants";
import WPPage from "@rnaga/wp-next-editor/server/components/WPPage";

// This file serves as the homepage route. The template slug is statically set
// to "home" to map to the corresponding WordPress page template.
export default async function (props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const templateSlug = TEMPLATE_SLUG_HOMEPAGE;
  const searchParams = await props.searchParams;

  return <WPPage idOrSlug={templateSlug} searchParams={searchParams} />;
}
