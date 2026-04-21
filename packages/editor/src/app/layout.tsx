import { Suspense } from "react";

import {
  ResolveWPHeadResources,
  WPBodyWithAttributes,
} from "@rnaga/wp-next-editor/server/components/WPResources";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <html suppressHydrationWarning>
        <head>
          <ResolveWPHeadResources />
        </head>
        <WPBodyWithAttributes>{children}</WPBodyWithAttributes>
      </html>
    </Suspense>
  );
}
