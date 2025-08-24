import { hooks } from "_wp/hooks/client";
import { createContext, useContext, useRef } from "react";

import { defineHooks } from "@rnaga/wp-node/common/define-hooks";

import { useGlobalRef } from "./wp/use-global-ref";
import { useGlobalState } from "./wp/use-global-state";
import { useLocalSettingsState } from "./wp/use-local-settings";
import { useViewport } from "./wp/use-viewport";

import type * as types from "../types";
import type * as wpTypes from "@rnaga/wp-node/types";

import { coreInitialState } from "./wp/core-initial-global-state";

/**
 * Context for the WPProvider component.
 */
const WPContext = createContext<types.client.WP>({} as any);

/**
 * Custom hook to access the WPContext.
 * @returns The WPContext value.
 */
export const useWP = () => useContext(WPContext);

/**
 * Provider component for the WPContext.
 * @param props - The component props.
 * @returns The rendered WPProvider component.
 */
export const WPProvider = (props: {
  children: React.ReactNode;
  user?: types.User;
  initialState?: Partial<types.client.GlobalState>;
}) => {
  const { children, user, initialState } = props;

  // Initialize global state and references
  const globalState = useGlobalState({
    ...initialState,
    ...coreInitialState,
    user,
  });
  const globalRef = useGlobalRef();
  const viewport = useViewport();

  // Initialize WP hooks
  const wpHooks = useRef<
    wpTypes.hooks.Hooks<types.hooks.Filters, types.hooks.Actions>
  >(defineHooks("__wp-next-client__", hooks));

  // Initialize local settings state and setter
  const { localSettings, setLocalSettings } = useLocalSettingsState();

  // Construct the value object for the WPContext
  const value = {
    wpHooks: wpHooks.current,
    user,
    globalState,
    globalRef,
    viewport,
    localSettings: {
      values: localSettings,
      set: setLocalSettings,
    },
    error: {
      throw: (message: string) => {
        globalState.set("error", { message });
      },
      message: globalState.get("error")?.message,
      set: (message?: string) => globalState.set({ error: { message } }),
    },
  };

  return <WPContext value={value}>{children}</WPContext>;
};
