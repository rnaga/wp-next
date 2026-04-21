import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelectedNode } from "../../global-event";
import { useMouseTool } from "../MouseToolContext";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { applyBaseOverlayStyles } from "./toolbox-core";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  TOOLBOX_CREATED_COMMAND,
  TOOLBOX_DESTROYED_COMMAND,
  TOOLBOX_END_RESIZE_COMMAND,
  TOOLBOX_START_RESIZE_COMMAND,
} from "../commands";
import { useToolBox } from "./ToolBoxContext";
import { Toolbar } from "../toolbar/Toolbar";
import { Box } from "@mui/material";
import { $getTransformCSSType } from "../../../lexical/styles/transform";
import { openNodeContextMenu } from "../../keys-menu/NodeContextMenu";
import { useMouseEvent } from "../mouse-event/use-mouse-event";
import { useToolboxOverlay } from "./use-toolbox-overlay";
import { useToolboxResize } from "./use-toolbox-resize";

const CustomToolBox = () => {
  const props = { component: useToolBox().component };
  const CustomComponent = props.component;
  const { wpHooks } = useWP();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const removeStart = wpHooks.action.addCommand(
      TOOLBOX_START_RESIZE_COMMAND,
      () => setIsVisible(false)
    );
    const removeEnd = wpHooks.action.addCommand(
      TOOLBOX_END_RESIZE_COMMAND,
      () => setIsVisible(true)
    );
    return () => {
      removeStart();
      removeEnd();
    };
  }, [wpHooks]);

  if (!CustomComponent || !isVisible) return null;
  return <CustomComponent />;
};

export const ToolBox = () => {
  const { canvasBoxRef, toolBoxRef } = useMouseTool();
  const { selectedNode, setSelectedNode } = useSelectedNode();
  const { wpHooks } = useWP();
  const { getListeners } = useMouseEvent();
  const [editor] = useLexicalComposerContext();

  const selectedNodeRef = useRef<WPLexicalNode | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);

  const getElementByNodeKey = useCallback(
    (key: string) =>
      editor.read(() => editor.getElementByKey(key) as HTMLElement | null),
    [editor]
  );

  const { transformType, setTransformType, beginResize } = useToolboxResize({
    selectedNodeRef,
    targetElementRef,
  });

  const { applyOverlayPosition } = useToolboxOverlay({
    getElementByNodeKey,
    setTransformType,
  });

  // When a node is newly selected, initialize and position the overlay
  useEffect(() => {
    if (
      selectedNode &&
      selectedNode.getKey() !== selectedNodeRef.current?.getKey()
    ) {
      const targetElement = getElementByNodeKey(selectedNode.getKey());
      if (!targetElement) return;

      const toolBoxOverlay = toolBoxRef.current!;
      applyBaseOverlayStyles(toolBoxOverlay);

      const type = editor.read(() => $getTransformCSSType(selectedNode));
      setTransformType(type);

      applyOverlayPosition(targetElement);
      canvasBoxRef.current?.appendChild(toolBoxOverlay);
      toolBoxOverlay.style.setProperty("display", "block");

      // Explicitly restore visibility: wheel pan hides the overlay via
      // CANVAS_WHEEL_PAN_START_COMMAND. If the user clicks a new node while
      // (or after) panning, the overlay would otherwise remain invisible.
      toolBoxOverlay.style.setProperty("visibility", "visible");

      selectedNodeRef.current = selectedNode;
      targetElementRef.current = targetElement;

      wpHooks.action.doCommand(TOOLBOX_CREATED_COMMAND, {
        node: selectedNode,
        toolBoxRef,
      });
      return;
    }

    if (!selectedNode) {
      toolBoxRef.current?.style.setProperty("display", "none");
      selectedNodeRef.current = null;
      targetElementRef.current = null;
      wpHooks.action.doCommand(TOOLBOX_DESTROYED_COMMAND, undefined);
    }
  }, [selectedNode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      toolBoxRef.current?.style.setProperty("display", "none");
      selectedNodeRef.current = null;
    };
  }, []);

  // Attach wheel listeners to toolbox for zoom/scroll passthrough
  useEffect(() => {
    const toolboxElement = toolBoxRef.current;
    if (!toolboxElement) return;

    const listeners = getListeners().filter(([type]) => type === "wheel");
    listeners.forEach(([type, handler]) =>
      toolboxElement.addEventListener(type, handler)
    );
    return () => {
      listeners.forEach(([type, handler]) =>
        toolboxElement.removeEventListener(type, handler)
      );
    };
  }, [getListeners]);

  return (
    <>
      <Toolbar />
      <Box
        id="mouse-tool-toolbox"
        ref={(ref: HTMLDivElement) => {
          if (!ref) return;
          toolBoxRef.current = ref;

          ref.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openNodeContextMenu(
              editor,
              selectedNodeRef.current!,
              event as unknown as React.MouseEvent
            );
          });

          ref.addEventListener("click", (event) => {
            if (event.target === ref) {
              setSelectedNode(undefined);
            }
          });
        }}
        style={{ display: "none" }}
      >
        <CustomToolBox />
      </Box>
    </>
  );
};
