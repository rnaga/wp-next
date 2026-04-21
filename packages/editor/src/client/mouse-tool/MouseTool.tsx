import React, { useRef } from "react";

import { Box } from "@mui/material";

import { CanvasBox } from "./CanvasBox";
import { MouseEventBox } from "./mouse-event/MouseEventBox";
import { MouseToolContext } from "./MouseToolContext";
import { ToolBox } from "./toolbox/ToolBox";
import { ToolBoxContext } from "./toolbox/ToolBoxContext";

export const MouseTool = () => {
  return (
    <MouseToolContext>
      <Box
        id="mouse-tool-container"
        sx={{
          // Adjust positioning for fixed or absolutely positioned elements.
          transform: "translateZ(0)",
        }}
      >
        <MouseEventBox />
        <CanvasBox />
        <ToolBoxContext>
          <ToolBox />
        </ToolBoxContext>
      </Box>
    </MouseToolContext>
  );
};
