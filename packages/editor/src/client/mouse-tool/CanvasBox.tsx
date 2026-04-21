import { useEffect } from "react";
import {
  PREVIEW_LAYER_STYLE_UPDATED_COMMAND,
  usePreviewLayer,
} from "../preview-layer";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Box } from "@mui/material";
import { useBreakpoint } from "../breakpoint";
import { useMouseTool } from "./MouseToolContext";
import { syncStyles } from "./dom";
import { MOUSETOOL_CANVAS_BOX_LOADED } from "./commands";

export const CanvasBox = () => {
  const { iframeRef } = usePreviewLayer();
  const { wpHooks } = useWP();
  const { breakpointRef } = useBreakpoint();
  const { canvasBoxRef } = useMouseTool();

  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_LAYER_STYLE_UPDATED_COMMAND,
      () => {
        if (!iframeRef.current || !canvasBoxRef.current) return;
        syncStyles({
          iframe: iframeRef.current,
          targetBox: canvasBoxRef.current,
          container: null,
          scale: breakpointRef.current.scale,
        });
      }
    );
  }, []);

  if (iframeRef.current === null) {
    return null;
  }

  return (
    <Box
      id="mouse-tool-canvas"
      ref={(ref: HTMLElement) => {
        if (!ref) {
          return;
        }

        canvasBoxRef.current = ref;

        wpHooks.action.doCommand(MOUSETOOL_CANVAS_BOX_LOADED, {
          canvasBoxRef,
        });

        if (!iframeRef.current || !canvasBoxRef.current) return;
        syncStyles({
          iframe: iframeRef.current,
          targetBox: canvasBoxRef.current,
          container: null,
          scale: breakpointRef.current.scale,
        });
      }}
      sx={{
        position: "absolute",
        //zIndex: 10,
        // // Adjust positioning for fixed or absolutely positioned elements.
        // transform: "translateZ(0)",
      }}
    />
  );
};
