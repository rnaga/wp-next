import type * as wpTypes from "@rnaga/wp-node/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Dispatch, SetStateAction } from "react";

import { getCurrent } from "@rnaga/wp-next-core/server/actions/user";

import { useSidebar } from "../client/hooks/use-sidebar";
import { useComment } from "../client/wp-admin/use-comment";
import { useMediaSelector } from "../client/wp-admin/use-media-selector";
import { useOverlayState } from "../client/wp-admin/use-overlay";

export interface AdminSite {
  name: string;
  baseUrl: string;
  isMultiSite: boolean;
  isSubdomainInstall: boolean;
  isSsl: boolean;
  blogBasePath: string;
  basePath: string;
  blogId: number;
  siteId: number;
  paths: string[];
  settings: wpTypes.crud.CrudReturnType<"settings", "get">["data"];
}

// export type AdminUser = wpCoreTypes.client.User &
//   Awaited<ReturnType<typeof getCurrent>>["data"];
export type AdminUser = Awaited<ReturnType<typeof getCurrent>>["data"];

type SetState<T> = Dispatch<SetStateAction<T>>;

export type WPAdmin = {
  wp: wpCoreTypes.client.WP;
  site: AdminSite;
  overlay: ReturnType<typeof useOverlayState>;
  sidebar: ReturnType<typeof useSidebar>;
  comment: ReturnType<typeof useComment>;
};

export * from "./client/index.d";
