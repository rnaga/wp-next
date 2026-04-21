import { COMMAND_PRIORITY_HIGH } from "lexical";
import React, { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { NODE_DRAG_START_COMMAND } from "../../node-event";
import { PREVIEW_LAYER_STYLE_UPDATED_COMMAND } from "../../preview-layer";
import {
  CANVAS_WHEEL_PAN_START_COMMAND,
  CANVAS_ZOOMING_COMMAND,
  MOUSETOOL_CANVAS_BOX_LOADED,
} from "../commands";
import { removeHoverOverlay } from "../dom";
import { useMouseTool } from "../MouseToolContext";
import { useMouseEvent } from "./use-mouse-event";
import { addWPHooksActionCommands } from "../../event-utils/add-commands";

export const MouseEventBox = () => {
  const { wpHooks } = useWP();
  const [editor] = useLexicalComposerContext();
  const { canvasBoxRef, eventBoxRef, mouseToolState } = useMouseTool();

  // Initialize event listeners via hook
  const { getListeners, iframeRef, syncCanvasStyles } = useMouseEvent();

  useEffect(() => {
    const eventBoxElement = eventBoxRef.current;
    if (!eventBoxElement) return;

    const listeners = getListeners();
    listeners.forEach(([type, handler]) =>
      eventBoxElement.addEventListener(type, handler)
    );

    return () => {
      listeners.forEach(([type, handler]) =>
        eventBoxElement.removeEventListener(type, handler)
      );
    };
  }, [getListeners]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_DRAG_START_COMMAND,
      () => {
        mouseToolState.current = "dragging";
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, mouseToolState]);

  // Respond when preview layer styles change (resize/scale)
  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_LAYER_STYLE_UPDATED_COMMAND,
      () => {
        if (!canvasBoxRef.current) return;
        syncCanvasStyles();
      }
    );
  }, [wpHooks, canvasBoxRef, syncCanvasStyles]);

  // Re-initialize when canvas box is reported as loaded
  useEffect(() => {
    return wpHooks.action.addCommand(MOUSETOOL_CANVAS_BOX_LOADED, () => {
      syncCanvasStyles();
    });
  }, [wpHooks, syncCanvasStyles]);

  // Remove the hover overlay when the canvas scale changes (zoom) or a pan
  // gesture starts — in both cases the overlay's cached rect becomes stale.
  // The overlay re-appears naturally on the next mouse-move event.
  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [CANVAS_ZOOMING_COMMAND, CANVAS_WHEEL_PAN_START_COMMAND],
      removeHoverOverlay
    );
  }, [wpHooks]);

  if (iframeRef.current === null) return null;

  return (
    <Box
      id="mouse-event-box"
      ref={(el: HTMLElement) => {
        if (!el) return;
        eventBoxRef.current = el;
        syncCanvasStyles();
      }}
      sx={{
        width: "100%",
        height: "100%",
        position: "absolute",
        zIndex: 1,
        top: 0,
        left: 0,
      }}
    />
  );
};
