import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

type InitialState = Omit<wpCoreTypes.client.GlobalState, "user" | "adminUser">;

export const initialState: InitialState = {
  "page-segment": "default",
  page: "dashboard",
  sidebar: {
    collapsed: false,
    sticked: true,
    width: 200,
    marginLeft: 200,
    menus: [],
  },
  "overlay-snakbar": {
    type: "success",
    open: false,
    message: "",
  },
  "overlay-confirm": {
    isOpen: false,
    title: "",
    message: "",
    callback: (confirm: boolean) => {},
  },
  "overlay-backdrop": {
    open: false,
    component: undefined,
    onClick: undefined,
    zIndex: 100,
  },
  error: {
    message: undefined,
  },
  "layout-keys": {
    header: 1,
    sidebar: 2,
    main: 3,
    content: 4,
  },
  "blog-create-blog-modal": {
    open: false,
  },
  "site-create-site-modal": {
    open: false,
  },
  "user-create-user-modal": {
    open: false,
  },
};
