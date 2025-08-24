//import { useGlobalState } from "/use-global-state";

import type * as types from "../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const useSidebar = (props: {
  globalState: wpCoreTypes.client.WP["globalState"];
  viewport: { isMobile: boolean; isDesktop: boolean };
}) => {
  const { globalState, viewport } = props;
  const { menus, ...state } = globalState.get("sidebar");

  const px = {
    collapsed: viewport.isMobile || !menus || 0 === menus.length ? 0 : 60,
    open: !menus || 0 === menus.length ? 0 : 200,
  };

  const open = () =>
    globalState.set("sidebar", {
      collapsed: false,
      sticked: true,
      width: px.open,
      marginLeft: px.open,
      menus,
    });

  const close = () =>
    globalState.set("sidebar", {
      collapsed: true,
      sticked: false,
      width: px.collapsed,
      marginLeft: px.collapsed,
      menus,
    });

  const toggle = (collapsed: boolean) => {
    globalState.set("sidebar", {
      collapsed: collapsed ? false : true,
      sticked: state.sticked ? false : true,
      width: collapsed ? px.open : px.collapsed,
      marginLeft: px.collapsed,
      menus,
    });
  };

  const setMenus = (menus: types.client.AdminMenu[]) => {
    globalState.set("sidebar", {
      ...state,
      menus,
    });
  };

  const setState = (
    state: Omit<wpCoreTypes.client.GlobalState["sidebar"], "menus">
  ) => {
    globalState.set("sidebar", { ...state, menus });
  };

  return {
    open,
    close,
    toggle,
    state,
    setState,
    px,
    menus,
    setMenus,
  };
};
