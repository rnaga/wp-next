import { RootLayout } from "@rnaga/wp-next-admin/server/components/RootLayout";
import { headers } from "next/headers";

// eslint-disable-next-line import/no-anonymous-default-export
export default async (props: { children: React.ReactNode }) => {
  const headersList = await headers();

  const pathname = headersList.get("x-invoke-path") || "";
  const isPreviewRoute = /\/(preview|full-preview)(\/|$)/.test(pathname);

  // Keep preview routes minimal inside iframe and avoid admin-shell prefetches.
  if (isPreviewRoute) {
    return <>{props.children}</>;
  }

  return RootLayout(props);
};
