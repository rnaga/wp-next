import type { AdminMenu, AdminPageSegment } from "../client/menus";
import type { WPAdmin } from "../client";

import { experimental_extendTheme as materialExtendTheme } from "@mui/material/styles";
import { Context } from "@rnaga/wp-node/core/context";

import { useAdminNavigation } from "../../client/hooks/use-admin-navigation";
import type { WpTheme } from "../client";

export {};

type AdminNavigation = ReturnType<
  typeof useAdminNavigation<Record<string, any>>
>;

declare module "@rnaga/wp-node/types/hooks/filters.d" {
  export interface Filters {}
}

declare module "@rnaga/wp-next-core/types/hooks/filters.d" {
  export interface Filters {
    next_admin_menu: (
      menu: AdminMenu[],
      segment: AdminPageSegment,
      params: {
        wpAdmin: WPAdmin;
        navigation: AdminNavigation;
      }
    ) => AdminMenu[];

    next_admin_preload_modal: (
      components: React.ReactNode[],
      params: {
        wpAdmin: WPAdmin;
        navigation: AdminNavigation;
      }
    ) => React.ReactNode[];
  }
}
