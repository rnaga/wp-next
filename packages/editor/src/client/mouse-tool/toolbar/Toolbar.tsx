import React, { useEffect, useRef, useState } from "react";
import { useMouseTool } from "../MouseToolContext";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { useSelectedNode } from "../../global-event";
import { useToolBox } from "../toolbox/ToolBoxContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Box } from "@mui/material";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarMenu } from "./ToolbarMenu";
import {
  TOOLBOX_CREATED_COMMAND,
  TOOLBOX_DESTROYED_COMMAND,
  TOOLBOX_STYLE_UPDATED_COMMAND,
} from "../commands";
import { WP_BREAKPOINT_CHANGED_COMMAND } from "../../breakpoint/commands";

export const Toolbar = () => {
  const toolbarRef = useRef<HTMLElement>(null);
  const { settings, menus } = useToolBox();
  const { toolBoxRef, canvasBoxRef } = useMouseTool();
  const { wpTheme } = useWPTheme();
  const { selectedNode, setSelectedNode } = useSelectedNode();
  const { wpHooks } = useWP();
  const [display, setDisplay] = useState<"none" | "flex">("none");

  // Position the toolbar relative to toolbox/canvas
  const positionToolbar = () => {
    const toolbarEl = toolbarRef.current;
    const toolBoxEl = toolBoxRef.current;
    const canvasBoxEl = canvasBoxRef.current;

    if (!toolbarEl || !toolBoxEl || !canvasBoxEl) return;

    const toolBoxRect = toolBoxEl.getBoundingClientRect();
    const canvasRect = canvasBoxEl.getBoundingClientRect();

    // If toolbox is near the top, place toolbar below; otherwise above
    toolbarEl.style.top =
      toolBoxRect.top < 100 ? `${toolBoxRect.height}px` : "-40px";

    const leftDiff = canvasRect.left - toolBoxRect.left;
    toolbarEl.style.left = leftDiff > 0 ? `${leftDiff}px` : "0px";
  };

  // Mount toolbar inside toolbox when created
  useEffect(() => {
    const removes: VoidFunction[] = [];

    removes.push(
      wpHooks.action.addCommand(
        TOOLBOX_CREATED_COMMAND,
        ({ toolBoxRef: createdToolBoxRef }) => {
          const el = toolbarRef.current;
          const box = createdToolBoxRef.current;
          if (!el || !box) return;
          box.append(el);
          setDisplay("flex");
          positionToolbar();
        }
      )
    );

    removes.push(
      wpHooks.action.addCommand(
        TOOLBOX_STYLE_UPDATED_COMMAND,
        () => {
          positionToolbar();
        }
      )
    );

    return () => {
      removes.forEach((remove) => remove());
    };
  }, [wpHooks, toolBoxRef.current, canvasBoxRef]);

  // Unmount toolbar when toolbox is destroyed
  useEffect(() => {
    return wpHooks.action.addCommand(TOOLBOX_DESTROYED_COMMAND, () => {
      setDisplay("none");
    });
  }, [wpHooks]);

  // Reposition on breakpoint changes while visible
  useEffect(() => {
    if (display === "none") return;

    const unregisterBreakpoint = wpHooks.action.addCommand(
      WP_BREAKPOINT_CHANGED_COMMAND,
      () => {
        positionToolbar();
      }
    );

    return () => {
      unregisterBreakpoint();
    };
  }, [wpHooks, display, toolBoxRef, canvasBoxRef]);

  // Close menus when selection changes
  useEffect(() => () => menus?.close(), [selectedNode]);

  return (
    <Box
      ref={toolbarRef}
      sx={{
        display,
        zIndex: 10000,
        position: "absolute",
        flexWrap: "nowrap",
        mt: 1,
        borderTopRightRadius: 7,
        borderBottomRightRadius: 7,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: wpTheme.mousetoolBox.backgroundColor,
      }}
      onMouseMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {settings.isEnabled && settings.isOpen && (
        <ToolbarButton
          title="Expand"
          onClick={() => {
            settings.close();
          }}
        >
          <OpenInFullIcon />
        </ToolbarButton>
      )}

      {!settings.isOpen && (
        <>
          <Box
            sx={{
              display: "flex",
            }}
            onClick={(e) => {
              // Need to stop propagation to prevent the toolbox from closing
              //
              // There's click event on the parent element (ResizableBox) that closes the toolbox
              // so we need to stop the propagation of the click event
              e.stopPropagation();
            }}
          >
            <Typography
              sx={{
                display: "flex",
                alignItems: "center",
                color: wpTheme.mousetoolBox.color,
                px: 1,
                py: 0.25,
                whiteSpace: "nowrap",
                fontSize: wpTheme.mousetoolBox.fontSize,
              }}
            >
              {selectedNode?.getType()}
            </Typography>

            {settings.isEnabled && (
              <ToolbarButton title="Settings" onClick={() => settings.open()}>
                <SettingsIcon />
              </ToolbarButton>
            )}
            {menus?.get().length > 0 && <ToolbarMenu />}
          </Box>
          <ToolbarButton
            title="Close"
            onClick={() => setSelectedNode(undefined)}
          >
            <CloseIcon />
          </ToolbarButton>
        </>
      )}

      <Box
        sx={{
          width: 7,
        }}
      />
    </Box>
  );
};
