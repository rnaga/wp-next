import { RootLayout } from "@rnaga/wp-next-admin/server/components/RootLayout";

// Change the title and description here
export const metadata = {
  title: "WP Next Admin",
  description: "Admin panel for WP Next",
};

// eslint-disable-next-line import/no-anonymous-default-export
export default async (props: { children: React.ReactNode }) =>
  RootLayout(props);
