import { useRef } from "react";

import { Box } from "@mui/material";

import { useCanvasPan } from "./use-canvas-pan";

/**
 * Outer `#canvas-area` container for the editor canvas.
 *
 * Delegates all pan interactions (wheel panning, Space+drag, zoom interception,
 * fullscreen offset save/restore) to useCanvasPan. The component itself is a
 * thin wrapper so MainArea stays focused on layout and layer composition.
 */
export const CanvasArea = ({ children }: { children: React.ReactNode }) => {
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  useCanvasPan(canvasAreaRef);

  return (
    <Box
      id="canvas-area"
      ref={canvasAreaRef}
      sx={{
        height: "100dvh",
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      {children}
    </Box>
  );
};
