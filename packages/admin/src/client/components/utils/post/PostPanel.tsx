"use client";

import {
  createContext,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import { useWPAdmin } from "../../../wp-admin";
import { useTheme } from "@mui/material";

const PanelContext = createContext(
  {} as {
    toggle: () => void;
    ref: RefObject<ImperativePanelHandle | null>;
  }
);

export const usePanelContext = () => useContext(PanelContext);

export const PostPanelWrapper = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const ref = useRef<ImperativePanelHandle>(null);

  const toggleSettings = () => {
    const panel = ref.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <PanelContext.Provider value={{ toggle: toggleSettings, ref }}>
      {children}
    </PanelContext.Provider>
  );
};

export const PostPanel = (props: {
  onCollapse?: () => void;
  onExpand?: () => void;
  children: [React.ReactNode, React.ReactNode];
}) => {
  const { onCollapse, onExpand, children } = props;
  const {
    wp: { viewport },
  } = useWPAdmin();
  const theme = useTheme();
  const { ref } = useContext(PanelContext);

  const getPanelState = useCallback(
    () =>
      viewport.isMobile
        ? {
            editor: {
              minSize: 0,
            },
            border: {
              style: undefined,
            },
            settings: {
              key: 1,
              minSize: 100,
            },
          }
        : {
            editor: {
              minSize: 30,
            },
            border: {
              style: ref.current?.isCollapsed()
                ? undefined
                : {
                    borderLeft: "1px solid",
                    borderColor: theme.palette.divider,
                    marginRight: 10,
                  },
            },
            settings: {
              key: 2,
              minSize: 25,
            },
          },
    [viewport.isMobile, ref.current]
  );

  const [panel, setPanel] = useState(getPanelState());

  const handlePanelChange = (collapse: "collapse" | "expand") => () => {
    collapse ? onCollapse?.() : onExpand?.();
    setPanel(getPanelState());
  };

  useEffect(() => {
    setPanel(getPanelState());
  }, [viewport.isMobile]);

  return (
    <PanelGroup direction="horizontal">
      <Panel minSize={panel.editor.minSize}>{children[0]}</Panel>
      <PanelResizeHandle style={panel.border.style} />
      <Panel
        key={panel.settings.key}
        defaultSize={25}
        minSize={panel.settings.minSize}
        collapsible
        ref={ref}
        onCollapse={handlePanelChange("collapse")}
        onExpand={handlePanelChange("expand")}
      >
        {children[1]}
      </Panel>
    </PanelGroup>
  );
};
