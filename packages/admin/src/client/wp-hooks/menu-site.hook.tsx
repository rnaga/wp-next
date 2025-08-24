"use client";

import BookIcon from "@mui/icons-material/Book";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import WebIcon from "@mui/icons-material/Web";
import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";

import { Admin } from "../../client/components/contents";

import type * as types from "../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

/**
 * MenuSiteHook
 *
 * This hook adds the site menu items to the admin menu.
 */
@hook("next_admin_site_menu")
export class MenuSiteHook {
  @clientFilter("next_admin_menu")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_menu"]>
  ) {
    const [
      adminMenus,
      segment,
      {
        wpAdmin,
        navigation: { goto, resolvePath },
      },
    ] = args;

    if (segment !== "site") {
      return adminMenus;
    }

    const {
      wp: { globalState },
    } = wpAdmin;

    const siteMenu: types.client.AdminMenu[] = [
      {
        icon: <DashboardIcon />,
        displayOnSidebar: true,
        capabilities: ["read"],
        label: "Dashboard",
        onClick: () => {
          goto(resolvePath("blog"));
        },
      },
      {
        icon: <GroupIcon />,
        displayOnSidebar: true,
        component: <Admin.Users.List />,
        capabilities: ["list_users"],
        label: "Users",
        path: `/${segment}/users`,
        nestedMenus: [
          {
            label: "All users",
            component: <Admin.Users.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/users`,
          },
          {
            label: "Edit",
            component: <Admin.Users.Edit />,
            displayOnSidebar: false,
            capabilities: ["list_users"],
            path: `/${segment}/users/edit`,
          },
          {
            displayOnSidebar: true,
            capabilities: ["create_users"],
            label: "Add New User",
            onClick: () => {
              globalState.set("user-create-user-modal", { open: true });
            },
          },
          {
            label: "Roles",
            component: <Admin.Roles />,
            displayOnSidebar: true,
            capabilities: ["manage_roles"],
            path: `/${segment}/users/roles`,
          },
          {
            label: "Delete User",
            component: <Admin.Users.Delete />,
            displayOnSidebar: false,
            capabilities: ["delete_users"],
            path: `/${segment}/users/delete`,
          },
        ],
      },
      {
        icon: <WebIcon />,
        displayOnSidebar: true,
        component: <Admin.Sites.List />,
        capabilities: ["manage_network"],
        label: "Sites",
        path: `/${segment}/sites`,
        nestedMenus: [
          {
            label: "All sites",
            component: <Admin.Sites.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/sites`,
          },
          {
            displayOnSidebar: true,
            capabilitiesInherit: true,
            label: "Add New Site",
            onClick: () => {
              globalState.set("site-create-site-modal", { open: true });
            },
          },
          {
            label: "Edit",
            component: <Admin.Sites.Edit />,
            displayOnSidebar: false,
            capabilitiesInherit: true,
            path: `/${segment}/sites/edit`,
          },
          {
            label: "Delete",
            component: <Admin.Sites.Delete />,
            displayOnSidebar: false,
            capabilitiesInherit: true,
            path: `/${segment}/sites/delete`,
          },
        ],
      },
      {
        icon: <BookIcon />,
        displayOnSidebar: true,
        component: <Admin.Blogs.List />,
        capabilities: ["manage_network"],
        label: "Blogs",
        path: `/${segment}/blogs`,
        nestedMenus: [
          {
            label: "All blogs",
            component: <Admin.Blogs.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/blogs`,
          },
          {
            displayOnSidebar: true,
            capabilitiesInherit: true,
            label: "Add New Blog",
            onClick: () => {
              globalState.set("blog-create-blog-modal", { open: true });
            },
          },
          {
            label: "Edit",
            component: <Admin.Blogs.Edit />,
            displayOnSidebar: false,
            capabilitiesInherit: true,
            path: `/${segment}/blogs/edit`,
          },
        ],
      },
    ];

    return [...adminMenus, ...siteMenu];
  }
}
