import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelectedNode } from "../../global-event";
import { NodeKey } from "lexical";

import type * as types from "../../../types";

type Menu = [ReactNode, () => void];

type MouseHandlers = {
  onMouseDown?: types.ToolBoxMouseHandler;
  onMouseMove?: types.ToolBoxMouseHandler;
  onMouseUp?: types.ToolBoxMouseHandler;
};

type ToolBoxConfig = {
  menus: Menu[];
  component?: FC;
};

const toolBoxConfigMap = new Map<NodeKey, ToolBoxConfig>();

export const registerToolBox = (
  key: NodeKey,
  options: {
    menus?: Menu[];
    component?: FC;
  }
) => {
  const previous: ToolBoxConfig = toolBoxConfigMap.get(key) ?? { menus: [] };
  const config: ToolBoxConfig = {
    menus: options.menus ?? previous.menus,
    component: options.component ?? previous.component,
  };
  toolBoxConfigMap.set(key, config);
};

type ToolBoxContextValue = {
  settings: {
    isEnabled: boolean;
    enable: () => void;
    disable: () => void;
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };
  menus: {
    set: (menus: Menu[]) => void;
    reset: () => void;
    get: () => Menu[];
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
  component?: FC;
  mouseHandlers: {
    get: () => MouseHandlers;
    set: (handlers: MouseHandlers) => void;
  };
};

const Context = createContext<ToolBoxContextValue | null>(null);

export const useToolBox = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error("useToolBox must be used within a ToolBoxContext provider");
  }

  return context;
};

export const ToolBoxContext = ({ children }: { children: ReactNode }) => {
  const { selectedNode } = useSelectedNode();
  const [settingsEnableState, setSettingsEnableState] = useState(false);
  const [settingsOpenState, setSettingsOpenState] = useState(false);
  const [component, setComponent] = useState<FC | undefined>();
  const [mouseHandlersState, setMouseHandlersState] = useState<MouseHandlers>(
    {}
  );

  const enableSettings = useCallback(() => setSettingsEnableState(true), []);
  const disableSettings = useCallback(() => setSettingsEnableState(false), []);
  const openSettings = useCallback(() => setSettingsOpenState(true), []);
  const closeSettings = useCallback(() => setSettingsOpenState(false), []);

  const settings = useMemo(
    () => ({
      isEnabled: settingsEnableState,
      enable: enableSettings,
      disable: disableSettings,
      isOpen: settingsOpenState,
      open: openSettings,
      close: closeSettings,
    }),
    [
      disableSettings,
      enableSettings,
      openSettings,
      closeSettings,
      settingsEnableState,
      settingsOpenState,
    ]
  );

  const [menusState, setMenusState] = useState<Menu[]>([]);
  const [menusOpen, setMenusOpen] = useState(false);

  const setMenus = useCallback((menus: Menu[]) => setMenusState(menus), []);
  const resetMenus = useCallback(() => setMenusState([]), []);
  const openMenus = useCallback(() => setMenusOpen(true), []);
  const closeMenus = useCallback(() => {
    setMenusOpen(false);
    setSettingsOpenState(false);
  }, []);
  const toggleMenus = useCallback(() => setMenusOpen((prev) => !prev), []);

  const menus = useMemo(
    () => ({
      set: setMenus,
      reset: resetMenus,
      get: () => menusState,
      isOpen: menusOpen,
      open: openMenus,
      close: closeMenus,
      toggle: toggleMenus,
    }),
    [
      closeMenus,
      menusOpen,
      menusState,
      openMenus,
      resetMenus,
      setMenus,
      toggleMenus,
    ]
  );

  useEffect(() => {
    setComponent(() => {
      if (!selectedNode) return undefined;
      return toolBoxConfigMap.get(selectedNode.getType())?.component;
    });
  }, [selectedNode]);

  return (
    <Context
      value={{
        settings,
        menus,
        component,
        mouseHandlers: {
          get: () => mouseHandlersState,
          set: setMouseHandlersState,
        },
      }}
    >
      {children}
    </Context>
  );
};
