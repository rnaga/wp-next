import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { isValidPublicSlug } from "@rnaga/wp-next-editor/lexical/validate-slug";
import WPError from "@rnaga/wp-next-editor/server/components/WPError";
import { WPFooterResources } from "@rnaga/wp-next-editor/server/components/WPResources";
import { getPublicWpPageArgs } from "@rnaga/wp-next-editor/server/get-wp-page-args";
import { getWpPageResources } from "@rnaga/wp-next-editor/server/get-wp-page-resources";

async function PublicResources(props: { children: React.ReactNode }) {
  const { children } = props;

  const headersList = await headers();
  const wpPageArgs = getPublicWpPageArgs(headersList);

  // Only reject slugs that are structurally invalid (e.g. contain special
  // characters). Publish-status is NOT checked here because the published-slug
  // cache (unstable_cache) is stale-while-revalidate: immediately after a
  // visibility change the next request still sees the old cached list. The
  // authoritative check is done by getWpPageResources → getWpPage, which
  // queries the DB directly and returns NOT_FOUND when the template is
  // unpublished. The layout handles that case below.
  if (!wpPageArgs || !isValidPublicSlug(wpPageArgs.idOrSlug)) {
    return notFound();
  }

  const wpResources = await getWpPageResources(wpPageArgs).catch((err) => {
    console.error("Error fetching WP page resources in PublicRootLayout:", err);
    return {
      valid: false as const,
      statusType: "UNKNOWN_ERROR" as const,
      message: "Failed to load page resources.",
    };
  });

  if (!wpResources.valid) {
    console.warn(
      "No WP resources found for this page. Rendering without WP assets."
    );

    // Return WPError here (layout level) rather than delegating to WPPage in page.tsx,
    // since layout-level resource failures make any page render meaningless anyway.
    return (
      <WPError
        statusType={wpResources.statusType}
        error={wpResources.message}
      />
    );
  }

  return (
    <>
      {children}
      <WPFooterResources resources={wpResources} />
    </>
  );
}

export default function PublicRootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <Suspense>
      <PublicResources>{children}</PublicResources>
    </Suspense>
  );
}
