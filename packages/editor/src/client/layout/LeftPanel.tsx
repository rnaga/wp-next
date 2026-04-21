import React, { useEffect, useRef, useState } from "react";

import ArticleIcon from "@mui/icons-material/Article";
import CodeIcon from "@mui/icons-material/Code";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { Box, Tab, Tabs, Tooltip, useTheme } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { DataFetchingLeftPanelPlugin } from "../../lexical/nodes/data-fetching/client/DataFetchingLeftPanelPlugin";
import { CustomCodeNavigator } from "../custom-code";
import { DraggableEditorPlugin } from "../draggable/DraggableEditorPlugin";
import { addWPHooksActionCommands } from "../event-utils";
import { WP_UPDATE_FOCUS_ON_SELECTED_NODE_COMMAND } from "../global-event/commands";
import { Portal } from "../portal";
import { TemplateNavigator } from "../template/TemplateNavigator";
import { TreeNavigatorPlugin } from "../tree-navigator/TreeNavigatorPlugin";
import {
  CLOSE_LEFT_PANEL_COMMAND,
  MAIN_AREA_LOADED_CLICKED_COMMAND,
} from "./commands";

const PanelButton = (props: {
  children: React.ReactNode;
  selected: boolean;
  isPanelContentVisible: boolean;
  onClick: () => void;
  tooltip: string;
}) => {
  const theme = useTheme();

  const { selected, isPanelContentVisible, onClick, tooltip } = props;

  return (
    <Tooltip title={tooltip} placement="right">
      <Box
        sx={{
          backgroundColor:
            selected && isPanelContentVisible
              ? theme.palette.grey[300]
              : theme.palette.grey[200],
          "&:hover": {
            backgroundColor: theme.palette.grey[300],
          },
          borderRadius: 0,
          height: 50,
          color: theme.palette.grey[900],
          cursor: "pointer",
          userSelect: "none",

          // center text vertically and horizontally
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
        onClick={onClick}
      >
        {props.children}
      </Box>
    </Tooltip>
  );
};

export const LeftPanel = () => {
  const { wpHooks } = useWP();
  const [selectedPanel, setSelectedPanel] = useState<string>("a");
  const [isPanelContentVisible, setIsPanelContentVisible] =
    useState<boolean>(false);

  const [elementTabIndex, setElementTabIndex] = useState<number>(0);
  const { wpTheme } = useWPTheme();

  const isMouseInsidePanelButtons = useRef(false);

  const panelButtonsRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_UPDATE_FOCUS_ON_SELECTED_NODE_COMMAND,
      (focus: boolean) => {
        if (focus && !isMouseInsidePanelButtons.current) {
          handleClosePanel();
        }
      }
    );
  }, []);

  useEffect(() => {
    return addWPHooksActionCommands(wpHooks, [CLOSE_LEFT_PANEL_COMMAND], () => {
      handleClosePanel();
    });
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(MAIN_AREA_LOADED_CLICKED_COMMAND, () => {
      handleClosePanel();
    });
  }, []);

  const handlePanelClick = (panel: string) => () => {
    if (selectedPanel === panel && isPanelContentVisible) {
      handleClosePanel();
    } else {
      setIsPanelContentVisible(true);
      setSelectedPanel(panel);
    }
  };

  const handleElementTabClick = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    // Handle element click logic here
    setElementTabIndex(newValue);
  };

  const handleClosePanel = () => {
    setIsPanelContentVisible(false);
    setSelectedPanel("a");
    setElementTabIndex(0);
  };

  return (
    <Box>
      {/* Left Panel Buttons */}
      <Portal>
        <Box
          ref={panelButtonsRef}
          sx={{
            position: "fixed",
            top: 50,
            width: 50,
            zIndex: wpTheme.zIndex.layout + 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            <Box>
              <PanelButton
                selected={selectedPanel === "a"}
                isPanelContentVisible={isPanelContentVisible}
                onClick={handlePanelClick("a")}
                tooltip="Elements"
              >
                <WidgetsIcon fontSize="small" />
              </PanelButton>
            </Box>
            <Box>
              <PanelButton
                selected={selectedPanel === "b"}
                isPanelContentVisible={isPanelContentVisible}
                onClick={handlePanelClick("b")}
                tooltip="Templates"
              >
                <ArticleIcon fontSize="small" />
              </PanelButton>
            </Box>
            <Box>
              <PanelButton
                selected={selectedPanel === "c"}
                isPanelContentVisible={isPanelContentVisible}
                onClick={handlePanelClick("c")}
                tooltip="Custom Code"
              >
                <CodeIcon fontSize="small" />
              </PanelButton>
            </Box>
          </Box>
        </Box>
      </Portal>
      {/* Left Panel Content */}
      {isPanelContentVisible && (
        <Portal>
          <Box
            ref={panelContentRef}
            sx={{
              position: "fixed",
              top: 50,
              minWidth: 250,
              zIndex: wpTheme.zIndex.layout,
            }}
            onMouseEnter={() => {
              isMouseInsidePanelButtons.current = true;
            }}
            onMouseLeave={() => {
              isMouseInsidePanelButtons.current = false;
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 250,
                height: "95dvh",
                left: 50,
                overflowY: "auto",
              }}
            >
              <Box
                sx={{
                  display: selectedPanel === "a" ? "block" : "none",
                  backgroundColor: wpTheme.leftPanel.backgroundColor,
                  borderRight: `1px solid ${wpTheme.leftPanel.borderColor}`,
                  maxWidth: 250,
                  height: "105dvh", // Have some extra height to show panel properly.
                }}
              >
                <Tabs
                  value={elementTabIndex}
                  onChange={handleElementTabClick}
                  sx={{
                    minHeight: 48,
                    height: 48,
                    backgroundColor: wpTheme.leftPanelHeader.backgroundColor,
                    borderBottom: `1px solid ${wpTheme.leftPanelHeader.borderColor}`,
                    "& .MuiTabs-indicator": {
                      height: 2,
                    },
                  }}
                >
                  <Tab
                    label={
                      <Typography
                        size="small"
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: (theme) => theme.palette.grey[700],
                        }}
                      >
                        Element
                      </Typography>
                    }
                    value={0}
                    sx={{
                      textTransform: "none",
                      minWidth: 250 / 3,
                      minHeight: 48,
                      p: 0,
                    }}
                  />
                  <Tab
                    label={
                      <Typography
                        size="small"
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: (theme) => theme.palette.grey[700],
                        }}
                      >
                        Layers
                      </Typography>
                    }
                    value={1}
                    sx={{
                      textTransform: "none",
                      minWidth: 250 / 3,
                      minHeight: 48,
                      p: 0,
                    }}
                  />
                  <Tab
                    label={
                      <Typography
                        size="small"
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: (theme) => theme.palette.grey[700],
                        }}
                      >
                        Data
                      </Typography>
                    }
                    value={2}
                    sx={{
                      textTransform: "none",
                      minWidth: 250 / 3,
                      minHeight: 48,
                      p: 0,
                    }}
                  />
                </Tabs>
                {elementTabIndex === 0 && <DraggableEditorPlugin />}
                {elementTabIndex === 1 && <TreeNavigatorPlugin />}
                {elementTabIndex === 2 && <DataFetchingLeftPanelPlugin />}
              </Box>
              <Box
                sx={{
                  display: selectedPanel === "b" ? "block" : "none",
                  backgroundColor: wpTheme.leftPanel.backgroundColor,
                  borderRight: `1px solid ${wpTheme.leftPanel.borderColor}`,
                  maxWidth: 250,
                  height: "125dvh", // Have some extra height to show panel properly.
                }}
              >
                <TemplateNavigator />
              </Box>
              <Box
                sx={{
                  display: selectedPanel === "c" ? "block" : "none",
                  backgroundColor: wpTheme.leftPanel.backgroundColor,
                  borderRight: `1px solid ${wpTheme.leftPanel.borderColor}`,
                  maxWidth: 250,
                  height: "125dvh",
                }}
              >
                <CustomCodeNavigator />
              </Box>
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
};
