import * as React from "react";

export const metadata = {
  title: "WP-Next Admin",
  description: "Admin panel for WordPress",
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<Record<string, any>>;
}) {
  const { children } = props;
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
