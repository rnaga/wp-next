"use client";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { WPProvider } from "@rnaga/wp-next-core/client/wp";
import { FormDataProvider } from "@rnaga/wp-next-ui/FormDataProvider";
import ThemeRegistry from "@rnaga/wp-next-ui/ThemeRegistry";

import { WPAdminProvider } from "../wp-admin";
import { initialState } from "../wp-admin/initial-global-state";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

import type * as types from "../../types";

export const RootLayout = (props: {
  children: React.ReactNode;
  site: types.client.AdminSite;
  user: wpCoreTypes.client.User;
  adminUser: types.client.AdminUser;
  defaultMenuSegment: types.client.AdminPageSegment;
  session: Session;
}) => {
  const { site, user, adminUser, children, session, defaultMenuSegment } =
    props;

  return (
    <SessionProvider session={session}>
      <WPProvider initialState={initialState} user={user}>
        <ThemeRegistry>
          <WPAdminProvider
            site={site}
            adminUser={adminUser}
            defaultMenuSegment={defaultMenuSegment}
          >
            <FormDataProvider>{children}</FormDataProvider>
          </WPAdminProvider>
        </ThemeRegistry>
      </WPProvider>
    </SessionProvider>
  );
};

export default RootLayout;
