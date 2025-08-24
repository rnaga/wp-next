import { useEffect, useState } from "react";

import { useAdminNavigation } from "./use-admin-navigation";
import { useWPAdmin } from "../wp-admin";

import type * as types from "../../types";
export const useCurrentMenu = () => {
  const wpAdmin = useWPAdmin();
  const adminNavigation = useAdminNavigation();
  const {
    wp: { globalState, wpHooks },
  } = wpAdmin;

  const pageSegment = globalState.get("page-segment");
  const { currentPath } = useAdminNavigation();

  const [menus, setMenus] = useState<types.client.AdminMenu[]>([]);

  useEffect(() => {
    setMenus(
      wpHooks.filter.apply("next_admin_menu", [], pageSegment, {
        wpAdmin,
        navigation: adminNavigation,
      })
    );
  }, [pageSegment]);

  function innerFn(
    currentPath: string,
    menus: types.client.AdminMenu[],
    parentMenu?: types.client.AdminMenu
  ): undefined | [types.client.AdminMenu, types.client.AdminMenu | undefined] {
    for (const menu of menus) {
      if (
        (Array.isArray(menu.path) && menu.path.includes(currentPath)) ||
        menu.path === currentPath
      ) {
        return [menu, parentMenu];
      }
      if (Array.isArray(menu.nestedMenus)) {
        const result = innerFn(currentPath, menu.nestedMenus, menu);
        if (
          result &&
          ((Array.isArray(result[0]?.path) &&
            result[0]?.path.includes(currentPath)) ||
            result[0]?.path === currentPath)
        ) {
          return result;
        }
      }
    }

    return undefined;
  }

  const currentMenu = innerFn(currentPath, menus ?? []);
  return currentMenu;
};
