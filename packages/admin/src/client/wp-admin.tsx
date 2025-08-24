"use client";
import "reflect-metadata";

import React, { createContext, useContext, useEffect } from "react";

import { useWP } from "@rnaga/wp-next-core/client/wp";

import * as types from "../types";
import { useComment } from "./wp-admin/use-comment";
import { useOverlayState } from "./wp-admin/use-overlay";
import { useSidebar } from "./hooks/use-sidebar";
import { useViewport } from "@rnaga/wp-next-core/client/wp/use-viewport";

/**
 * Context for WPAdminProvider.
 */
export const WPAdminContext = createContext<types.client.WPAdmin>({} as any);

/**
 * Hook to access the WPAdminContext.
 */
export const useWPAdmin = () => useContext(WPAdminContext);

/**
 * Provider component for WPAdminContext.
 * @param props - The component props.
 * @param props.children - The child components.
 * @param props.defaultMenuSegment - The default menu segment.
 * @param props.adminUser - The admin user object.
 * @param props.site - The site object.
 * @returns The rendered component.
 */
export const WPAdminProvider = (props: {
  children: React.ReactNode;
  defaultMenuSegment: types.client.AdminPageSegment;
  adminUser: types.client.AdminUser;
  site: types.client.AdminSite;
}) => {
  const wp = useWP();
  const { defaultMenuSegment, adminUser, site, children } = props;

  const { globalState } = wp;

  useEffect(() => {
    globalState.set({
      "page-segment": defaultMenuSegment,
      adminUser,
    });
  }, []);

  const overlay = useOverlayState({ globalState });

  const viewport = useViewport();

  const sidebar = useSidebar({ globalState, viewport });

  const comment = useComment({ globalState });

  const contextValue: types.client.WPAdmin = {
    wp,
    overlay,
    sidebar,
    comment,
    site,
  };

  return <WPAdminContext value={contextValue}>{children}</WPAdminContext>;
};
