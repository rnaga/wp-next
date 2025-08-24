import { redirect } from "next/navigation";
import * as React from "react";

import { WrapperRootLayout as ClientRootLayout } from "../../client/components/WrapperRootLayout";
import * as actionsAdminUser from "@rnaga/wp-next-core/server/actions/admin-user";
import { AuthError } from "@rnaga/wp-next-core/client/components/auth";
import { WPAdmin } from "../wp-admin";

export const RootLayout = async (props: { children: React.ReactNode }) => {
  const { children } = props;

  const {
    wp,
    session,
    paths,
    basePath,
    blogBasePath,
    blogId,
    siteId,
    pageSegment,
  } = await WPAdmin();

  const blogName = (await wp.options.get<string>("blogname")) ?? "";

  if (!wp.current.user || !wp.current.user.props) {
    console.info(
      "User not found. If this occurs even after a successful login,",
      "check if all the necessary hooks are installed and activated.",
      "Specifically, check if NextCoreInit is properly added by getAdminHooks()."
    );
    return (
      <AuthError
        error="User not found. Please login again."
        showLogoutLink={true}
      />
    );
  }

  if (!process.env.BASE_URL) {
    console.info(
      "Base URL not found. Check if the environment variable BASE_URL is set."
    );
    return (
      <AuthError error="Base URL not found. Check if the environment variable BASE_URL is set." />
    );
  }

  const baseUrl = process.env.BASE_URL;
  const userId = wp.current.user.props.ID;

  const role = await wp.current.user.role();

  if (role.is("anonymous")) {
    if (wp.config.isMultiSite()) {
      const blogs = await wp.utils.user.getBlogs(userId);
      if (blogs.length) {
        redirect(
          `${process.env.WPAUTH_BASE_PATH}/${blogs[0].blog_id}/dashboard`
        );
      }
    }
    return (
      <AuthError
        error="You are not allowed to access this page. Logout and login again if you think this is a mistake."
        showLogoutLink={true}
      />
    );
  }

  const responseAdminUser = await actionsAdminUser.getAdminCurrent();
  if (!responseAdminUser.success || !responseAdminUser.data) {
    return <>{responseAdminUser.error}</>;
  }
  const currentAdminUser = responseAdminUser.data;

  const { user_pass, user_activation_key, ...currentUserProps } =
    wp.current.user.props;

  const settings = (await wp.utils.crud.settings.get()).data;

  return (
    <ClientRootLayout
      site={{
        name: blogName,
        paths,
        blogBasePath,
        basePath,
        blogId,
        siteId,
        isMultiSite: wp.config.isMultiSite(),
        isSubdomainInstall: wp.config.isSubdomainInstall(),
        isSsl: wp.config.isSsl(),
        baseUrl,
        settings,
      }}
      defaultMenuSegment={pageSegment}
      user={{
        ...currentUserProps,
        role: {
          names: new Set(role.names),
          capabilities: new Set(responseAdminUser.data.role.capabilities),
        },
      }}
      adminUser={currentAdminUser}
      session={session}
    >
      {children}
    </ClientRootLayout>
  );
};
