import { useGlobalRef } from "../client/wp/use-global-ref";
import { useGlobalState } from "../client/wp/use-global-state";
import { useLocalSettingsState } from "../client/wp/use-local-settings";
import { useViewport } from "../client/wp/use-viewport";
import { getCurrent } from "../server/actions/user";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as hooks from "./hooks";

export type User = Awaited<ReturnType<typeof getCurrent>>["data"];
export type Role = User["role"];

export interface GlobalState {
  user?: User;
  error: {
    message?: string;
  };
}

export interface GlobalRef {
  //user?: Exclude<wpTypes.Tables["users"], "user_pass" | "user_activation_key">;
}

export interface LocalSettings {
  // sidebarCollapsed: boolean;
}

export interface WP {
  wpHooks: wpTypes.hooks.Hooks<hooks.Filters, hooks.Actions>;
  globalState: ReturnType<typeof useGlobalState>;
  globalRef: ReturnType<typeof useGlobalRef>;
  viewport: ReturnType<typeof useViewport>;
  user?: User;
  localSettings: {
    values: ReturnType<typeof useLocalSettingsState>["localSettings"];
    set: ReturnType<typeof useLocalSettingsState>["setLocalSettings"];
  };
  error: {
    set: (message?: string) => void;
    throw: (message: string) => void;
    message: string | undefined;
  };
}
