"use client";

import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import CircleIcon from "@mui/icons-material/Circle";

import type * as wpAdminTypes from "@rnaga/wp-next-admin/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { CustomPage } from "./CustomPage";

/**
 * MenuCustomPageHook
 *
 * This hook adds the custom page menu items to the admin menu.
 */
@hook("next_admin_custom_menu")
export class MenuCustomHook {
  @clientFilter("next_admin_menu")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_menu"]>
  ) {
    let [, segment] = args;
    const [adminMenus] = args;

    // Add custom menu items only if the current segment is "blog" or "dashboard".
    // This ensures the custom menu appears for URLs like /admin/blog or /admin/dashboard.
    if (!["blog", "dashboard"].includes(segment)) {
      return adminMenus;
    }

    // Set the segment to "blog" for the custom menu items
    segment = "blog";
    const blogMenu: wpAdminTypes.client.AdminMenu[] = [
      {
        // This is the icon that will be displayed in the sidebar menu.
        icon: <CircleIcon />,

        // This determines whether the menu item is displayed on the sidebar.
        displayOnSidebar: true,

        // This is the component that will be rendered for the custom page
        component: <CustomPage />,

        // Set the capabilities required to access this menu item
        capabilities: ["read"],

        // This is the page title for the custom page
        label: "Custom Page",

        // This is the path where the custom page will be accessible
        // e.g. http://localhost:3000/admin/blog/custom
        path: `/${segment}/custom`,
      },
    ];

    return [...adminMenus, ...blogMenu];
  }
}
