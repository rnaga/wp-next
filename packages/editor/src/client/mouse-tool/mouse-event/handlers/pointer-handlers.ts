import type React from "react";
import type { LexicalEditor, LexicalNode } from "lexical";
import type { useWP } from "@rnaga/wp-next-core/client/wp";
import type { WPLexicalNode } from "../../../../lexical/nodes/wp";
import type { MouseToolState } from "../../MouseToolContext";
import type { useGlobalEvent, useSelectedNode } from "../../../global-event";
import { removeHoverOverlay } from "../../dom";
import { openNodeContextMenu } from "../../../keys-menu/NodeContextMenu";
import type { createMouseHandlers } from "../create-mouse-handlers";

type PointerHandlerDeps = {
  editor: LexicalEditor;
  wpHooks: ReturnType<typeof useWP>["wpHooks"];
  mouseToolState: React.RefObject<MouseToolState>;
  dragging: {
    end: (e: MouseEvent) => void;
  };
  dragStartRef: React.MutableRefObject<any>;
  clearDraggedOverlay: () => void;
  mouseHandlers: ReturnType<typeof createMouseHandlers>;
  mouseOverNodeRef: React.RefObject<LexicalNode | null>;
  setSelectedNode: ReturnType<typeof useSelectedNode>["setSelectedNode"];
  updateFocusOnSelectedNode: ReturnType<
    typeof useGlobalEvent
  >["globalEvent"]["updateFocusOnSelectedNode"];
  getNodeOnMouse: (
    event: MouseEvent,
    options?: { editableContextMenuOnly?: boolean }
  ) => WPLexicalNode | null;
};

export const createPointerHandlers = (deps: PointerHandlerDeps) => {
  const {
    editor,
    wpHooks,
    mouseToolState,
    dragging,
    dragStartRef,
    clearDraggedOverlay,
    mouseHandlers,
    mouseOverNodeRef,
    setSelectedNode,
    updateFocusOnSelectedNode,
    getNodeOnMouse,
  } = deps;

  const onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    clearDraggedOverlay();
    mouseHandlers.onMouseMove(event);
  };

  const onMouseDown = (event: MouseEvent) => {
    mouseHandlers.onMouseDown(event);
  };

  const onMouseUp = (event: MouseEvent) => {
    dragStartRef.current = null;
    clearDraggedOverlay();
    if (mouseToolState.current === "dragging") {
      dragging.end(event);
    }
    mouseToolState.current = "idle";
  };

  const onMouseLeave = () => {
    if (mouseToolState.current !== "idle") return;
    removeHoverOverlay();
  };

  const onClick = (event: MouseEvent) => {
    if (
      mouseToolState.current !== "resizing" &&
      mouseToolState.current !== "dragging"
    ) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedNode(mouseOverNodeRef.current as unknown as WPLexicalNode);
      updateFocusOnSelectedNode(true);
    }
  };

  const onContextMenu = (event: MouseEvent) => {
    const targetNode = getNodeOnMouse(event, { editableContextMenuOnly: true });
    if (!targetNode) return;
    event.preventDefault();
    event.stopPropagation();
    mouseToolState.current = "contextmenu";
    openNodeContextMenu(
      editor,
      targetNode,
      event as unknown as React.MouseEvent
    );
  };

  return {
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onClick,
    onContextMenu,
  };
};
