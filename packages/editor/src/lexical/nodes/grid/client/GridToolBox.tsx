import { $getNodeByKey, COMMAND_PRIORITY_HIGH } from "lexical";
import { JSX, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { useMouseMove } from "@rnaga/wp-next-ui/hooks/use-mouse-move";
import { useSelectedNode } from "../../../../client/global-event";
import { useMouseTool } from "../../../../client/mouse-tool/MouseToolContext";
import { NODE_CSS_UPDATED_COMMAND } from "../../../commands";
import { $updateCSS } from "../../../styles-core/css";
import { $isGridNode, GridNode } from "../GridNode";

export const GridToolBox = () => {
  const { selectedNode, selectedNodeRef, setSelectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();
  const ref = useRef<HTMLDivElement>(null);
  const eventRef = useRef<{
    isMouseDown: boolean;
    initialX: number | undefined;
    initialY: number | undefined;
  }>({
    isMouseDown: false,
    initialX: undefined,
    initialY: undefined,
  });

  const handleDeltaChange = (
    e: MouseEvent,
    delta: { x: number; y: number }
  ) => {
    const styling = editor.read(() => {
      const gridNode = $getNodeByKey(
        selectedNodeRef.current.node?.getKey()!
      ) as GridNode;
      return gridNode.__css.get().__layout;
    });

    const gap = String(styling.gap)
      ?.split(" ")
      .map((v: string) => parseInt(v)) || [0, 0];

    const newGap =
      [
        gap[0] + (Math.abs(delta.y) > 1 ? delta.y : 0),
        gap[1] + (Math.abs(delta.x) > 1 ? delta.x : 0),
      ].join("px ") + "px";

    eventRef.current.initialX = e.clientX;
    eventRef.current.initialY = e.clientY;

    editor.update(
      () => {
        $updateCSS({
          editor,
          node: selectedNodeRef.current.node,
          styles: {
            __layout: {
              ...styling,
              gap: newGap,
            },
          },
        });
      },
      { discrete: true }
    );
  };

  const { initMouseMove } = useMouseMove({
    onDeltaChange: handleDeltaChange,
    onClick: () => {
      setSelectedNode(undefined);
    },
    threshold: 1,
    debounceTime: 5,
    cursor: "move",
  });

  return (
    <Box
      ref={ref}
      sx={{
        //...baseSx,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        position: "absolute",
      }}
      onMouseDown={initMouseMove(ref)}
    />
  );
};
