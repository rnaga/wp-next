import { Suspense } from "react";
import { headers } from "next/headers";

import WPError from "@rnaga/wp-next-editor/server/components/WPError";
import { WPFooterResources } from "@rnaga/wp-next-editor/server/components/WPResources";
import { getAdminFullPreviewWpPageArgs } from "@rnaga/wp-next-editor/server/get-wp-page-args";
import { getWpPageResources } from "@rnaga/wp-next-editor/server/get-wp-page-resources";

// Change the title and description here
export const metadata = {
  title: "WP Next Admin & Editor",
  description: "WordPress admin panel and web builder editor for WP Next",
};

async function AdminResources(props: { children: React.ReactNode }) {
  const { children } = props;

  // Only used for the full preview page (/admin/[id]/full-preview/[...rest]).
  // For all other admin pages, wpPageArgs resolves to null and wpResources is
  // skipped, so no WP assets (styles, scripts, custom code) are injected.
  const headersList = await headers();
  const wpPageArgs = await getAdminFullPreviewWpPageArgs(headersList);
  const wpResources = wpPageArgs ? await getWpPageResources(wpPageArgs) : null;

  if (wpPageArgs && !wpResources?.valid) {
    console.warn(
      "No WP resources found for this page. Rendering without WP assets."
    );

    return (
      <WPError
        statusType={wpResources?.statusType || "NOT_FOUND"}
        error={wpResources?.message || "Failed to load page resources."}
      />
    );
  }

  return (
    <>
      {children}
      {wpResources && wpResources.valid && (
        <WPFooterResources resources={wpResources} />
      )}
    </>
  );
}

export default function AdminRootLayout(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminResources>{children}</AdminResources>
    </Suspense>
  );
}
