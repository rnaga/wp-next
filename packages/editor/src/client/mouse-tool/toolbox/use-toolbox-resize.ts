import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useBreakpoint } from "../../breakpoint";
import { useSelectedNode } from "../../global-event";
import { useMouseTool } from "../MouseToolContext";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { buildOverlayUI, startResize } from "./toolbox-core";
import { TOOLBOX_RESIZE_DIRECTIONS } from "../commands";

import type * as types from "../../../types";

type UseToolboxResizeDeps = {
  selectedNodeRef: React.RefObject<WPLexicalNode | null>;
  targetElementRef: React.RefObject<HTMLElement | null>;
};

export const useToolboxResize = (deps: UseToolboxResizeDeps) => {
  const { selectedNodeRef, targetElementRef } = deps;

  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const { breakpointRef } = useBreakpoint();
  const { mouseToolState, toolBoxRef } = useMouseTool();
  const { selectedNode } = useSelectedNode();

  const [transformType, setTransformType] = useState<"2d" | "3d">("2d");

  const beginResize = (
    direction: types.ResizeDirection,
    startEvent: MouseEvent
  ) => {
    if (!targetElementRef.current) return;
    startResize({
      direction,
      startEvent,
      scale: breakpointRef.current.scale,
      targetElement: targetElementRef.current,
      node: selectedNodeRef.current!,
      editor,
      wpHooks,
      mouseToolState,
      setState: (s: "resizing" | "idle") => (mouseToolState.current = s),
      getState: () => mouseToolState.current,
    });
  };

  // Rebuild overlay UI whenever transformType or selectedNode changes
  useEffect(() => {
    const toolBoxOverlay = toolBoxRef.current!;
    if (!selectedNode) return;

    const directions = wpHooks.filter.applyCommand(
      TOOLBOX_RESIZE_DIRECTIONS,
      {
        enabled: [
          "bottom",
          "left",
          "right",
          "rotate",
          "top",
          "corner",
        ] as types.ResizeDirection[],
        disabled: [] as types.ResizeDirection[],
      },
      { node: selectedNode }
    );

    if (transformType === "3d") {
      directions.disabled.push("corner");
    }

    buildOverlayUI(toolBoxOverlay, beginResize, {
      disabled: directions.disabled,
    });
  }, [transformType, selectedNode]);

  return { beginResize, transformType, setTransformType };
};
