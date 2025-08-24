import type * as wpTypes from "@rnaga/wp-node/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

import type { AdminPageSegment } from "./menus";
import type * as formData from "./form-data";
import type * as menus from "./menus";

import { getAdminCurrent } from "@rnaga/wp-next-core/server/actions/admin-user";

type SnackBarType = "error" | "info" | "success" | "warning";

export type AvailableSites = wpTypes.crud.CrudReturnType<
  "user",
  "getAvailableSites"
>["data"];

export type AvailableBlog =
  | AvailableSites["primary_blog"]
  | NonNullable<NonNullable<AvailableSites["sites"]>[number]["blogs"]>[number];

// export type GlobalStateSubscriber = (
//   value: wpCoreTypes.client.GlobalState
// ) => void;

declare module "@rnaga/wp-next-core/types/client" {
  export interface GlobalState {
    "page-segment": AdminPageSegment;
    page: string;
    sidebar: {
      collapsed: boolean;
      sticked: boolean;
      width: number; //0 | 58 | 220;
      marginLeft: number; //0 | 58 | 220;
      menus: menus.AdminMenu[];
    };
    adminUser: Awaited<ReturnType<typeof getAdminCurrent>>["data"];
    "user-create-user-modal": {
      open: boolean;
    };
    "site-create-site-modal": {
      open: boolean;
    };
    "blog-create-blog-modal": {
      open: boolean;
    };
    "media-edit-modal"?: {
      open: boolean;
    };

    "comment-edit-modal"?: {
      open: boolean;
      isReply: boolean;
      comment?:
        | wpTypes.Tables["comments"]
        | wpCoreTypes.actions.Comments[number];
      onSave?: (data: formData.CommentUpsert) => void;
    };
    "overlay-backdrop": {
      open: boolean;
      zIndex: number;
      component: React.ReactNode | undefined;
      onClick: (() => void) | undefined;
    };
    "overlay-snakbar": { type: SnackBarType; open: boolean; message: string };
    "overlay-confirm": {
      isOpen: boolean;
      title: string;
      message: string | React.ReactNode;
      callback: (confirm: boolean) => void;
    };
    "layout-keys": {
      header: number;
      sidebar: number;
      main: number;
      content: number;
    };
  }
}
