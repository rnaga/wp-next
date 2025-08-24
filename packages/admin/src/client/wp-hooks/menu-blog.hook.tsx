"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CommentIcon from "@mui/icons-material/Comment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PagesIcon from "@mui/icons-material/Pages";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";

import { Admin } from "../../client/components/contents";

import type * as types from "../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

/**
 * MenuBlogHook
 *
 * This hook adds the blog menu items to the admin menu.
 */
@hook("next_admin_blog_menu")
export class MenuBlogHook {
  @clientFilter("next_admin_menu")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_menu"]>
  ) {
    let [, segment] = args;
    const [adminMenus, , { wpAdmin }] = args;

    if (!["blog", "dashboard", "default"].includes(segment)) {
      return adminMenus;
    }

    const {
      site,
      wp: { globalState },
    } = wpAdmin;

    segment = "blog";
    const blogMenu: types.client.AdminMenu[] = [
      {
        icon: <DashboardIcon />,
        displayOnSidebar: true,
        component: <Admin.Dashboard />,
        capabilities: ["read"],
        label: "Dashboard",
        path: [
          `/${segment}/dashboard`,
          `/dashboard`,
          `/${segment}`,
          `/`,
          `/default`,
          "",
        ],
      },
      {
        icon: <ArticleIcon />,
        displayOnSidebar: true,
        component: <Admin.Posts.List />,
        capabilities: ["read"],
        label: "Posts",
        path: `/${segment}/posts`,
        nestedMenus: [
          {
            label: "All Posts",
            component: <Admin.Posts.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/posts`,
          },
          {
            label: "Edit",
            component: <Admin.Posts.Edit />,
            displayOnSidebar: false,
            capabilities: ["edit_posts"],
            path: `/${segment}/posts/edit`,
          },
          {
            label: "Add New Post",
            component: <Admin.Posts.Edit />,
            displayOnSidebar: true,
            capabilities: ["edit_posts"],
            path: `/${segment}/posts/addnew`,
          },
          // Add more nested items as needed
        ],
      },
      {
        displayOnSidebar: false,
        component: <Admin.Revisions />,
        capabilities: ["edit_posts"],
        label: "Revision",
        path: `/${segment}/revisions`,
      },
      {
        icon: <PermMediaIcon />,
        displayOnSidebar: true,
        component: <Admin.Media.List />,
        capabilities: ["read"],
        label: "Media",
        path: `/${segment}/media`,
        nestedMenus: [
          {
            label: "Library",
            component: <Admin.Media.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/media`,
          },
        ],
      },
      {
        icon: <PagesIcon />,
        displayOnSidebar: true,
        component: <Admin.Pages.List />,
        capabilities: ["read"],
        label: "Pages",
        path: `/${segment}/pages`,
        nestedMenus: [
          {
            label: "All Pages",
            component: <Admin.Pages.List />,
            displayOnSidebar: true,
            capabilitiesInherit: true,
            path: `/${segment}/pages`,
          },
          {
            label: "Edit",
            component: <Admin.Pages.Edit />,
            displayOnSidebar: false,
            capabilities: ["edit_pages"],
            path: `/${segment}/pages/edit`,
          },
          {
            label: "Add New Page",
            component: <Admin.Pages.Edit />,
            displayOnSidebar: true,
            capabilities: ["edit_pages"],
            path: `/${segment}/pages/addnew`,
          },
          // Add more nested items as needed
        ],
      },
      {
        icon: <LibraryBooksIcon />,
        displayOnSidebar: true,
        component: <Admin.Terms />,
        capabilities: ["edit_posts"],
        label: "Terms",
        path: `/${segment}/terms`,
      },
      {
        icon: <CommentIcon />,
        displayOnSidebar: true,
        component: <Admin.Comments.List />,
        capabilities: ["edit_posts"], //["moderate_comments"],
        label: "Comments",
        path: `/${segment}/comments`,
      },
      {
        icon: <PersonIcon />,
        displayOnSidebar: true,
        component: <Admin.Profile />,
        capabilities: ["read"],
        label: "Profile",
        path: `/${segment}/profile`,
      },
      {
        icon: <SettingsIcon />,
        displayOnSidebar: true,
        component: <Admin.Settings />,
        capabilities: ["manage_options"],
        label: "Settings",
        path: `/${segment}/settings`,
      },
    ];

    const userMenu: types.client.AdminMenu[] = [];
    if (!site.isMultiSite) {
      userMenu.push({
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
            capabilities: ["edit_user_roles"],
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
      });
    }

    return [...adminMenus, ...blogMenu, ...userMenu];
  }
}
