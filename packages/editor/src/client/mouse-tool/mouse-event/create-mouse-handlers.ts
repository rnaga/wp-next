import type { LexicalEditor, LexicalNode } from "lexical";
import { $getRoot } from "lexical";
import type { WPLexicalNode } from "../../../lexical/nodes/wp";
import type React from "react";
import {
  ensureHoverOverlay,
  removeHoverOverlay,
  parsePx,
  createDragTargetOverlay,
} from "../dom";
import { useDragDrop } from "../../drag-drop";
import { useBreakpoint } from "../../breakpoint";

export type MouseToolRefs = {
  canvasBox: React.RefObject<HTMLElement | null>;
  iframe: React.RefObject<HTMLIFrameElement | null>;
  breakpoint: ReturnType<typeof useBreakpoint>["breakpointRef"];
  mouseToolState: React.RefObject<import("../MouseToolContext").MouseToolState>;
  mouseOverElement: React.RefObject<HTMLElement | null>;
  mouseOverNode: React.RefObject<LexicalNode | null>;
  draggedOverElement: React.RefObject<HTMLElement | null>;
  dragStart: React.RefObject<{
    startClientX: number;
    startClientY: number;
    startLeft: number;
    startTop: number;
  } | null>;
};

export const createMouseHandlers = (args: {
  editor: LexicalEditor;
  dragDrop: ReturnType<typeof useDragDrop>;
  refs: MouseToolRefs;
  onStartDragging: (ev: React.MouseEvent, node: WPLexicalNode) => void;
  onEndDragging: (ev: MouseEvent) => void;
  getNodeOnMouse: (
    event: MouseEvent,
    options?: {
      editableMouseToolOnly?: boolean;
      editableContextMenuOnly?: boolean;
      removableOnly?: boolean;
    }
  ) => WPLexicalNode | null;
}) => {
  const { editor, dragDrop, refs, onStartDragging, getNodeOnMouse } = args;

  const handleOverlayDragMove = (event: MouseEvent) => {
    refs.draggedOverElement.current?.style.setProperty("display", "none");
    refs.draggedOverElement.current = null;

    const overlay = refs.mouseOverElement.current;
    const start = refs.dragStart.current;
    if (!overlay || !start) return;

    const dx = event.clientX - start.startClientX;
    const dy = event.clientY - start.startClientY;

    overlay.style.left = `${start.startLeft + dx}px`;
    overlay.style.top = `${start.startTop + dy}px`;

    const currentNodeKey = refs.mouseOverNode.current?.getKey();
    if (!currentNodeKey) return;
    const currentElement = editor.getElementByKey(currentNodeKey);
    if (!currentElement) return;

    const result = dragDrop.checkElementsUnderCursorAndSetTarget({
      element: currentElement as HTMLElement,
      contentDocument: refs.iframe.current!.contentDocument!,
      event,
    });

    if (result[0] === true) {
      const [, targetElementOrFlag, position] = result;
      if (targetElementOrFlag) {
        const rect = targetElementOrFlag.getBoundingClientRect();
        const overlay = createDragTargetOverlay(
          rect,
          refs.canvasBox.current!,
          refs.breakpoint.current.scale,
          position
        );
        refs.draggedOverElement.current = overlay;
        return;
      }
    } else {
      const [, isOverItself] = result;
      if (!isOverItself) {
        let rootKey: string | undefined;
        editor.read(() => {
          rootKey = $getRoot().getKey();
        });
        if (rootKey) {
          dragDrop.setTarget(rootKey, event);
          return;
        }
      }
    }

    dragDrop.setTarget(undefined, event);
  };

  const onMouseMove = (event: MouseEvent) => {
    if (
      refs.mouseToolState.current === "mousedown" ||
      refs.mouseToolState.current === "dragging" ||
      dragDrop.isDragging()
    ) {
      if (refs.mouseToolState.current === "mousedown") {
        onStartDragging(
          event as unknown as React.MouseEvent,
          refs.mouseOverNode.current as WPLexicalNode
        );
      }
      handleOverlayDragMove(event);
      return;
    }

    removeHoverOverlay();

    // Unset hover states
    refs.mouseOverElement.current = null;
    refs.mouseOverNode.current = null;

    // Code after this point is only for "idle" state
    if (refs.mouseToolState.current !== "idle") {
      return;
    }

    const targetNode = getNodeOnMouse(event, {
      editableMouseToolOnly: true,
    });

    if (!targetNode) {
      return;
    }

    const elementUnderCursor = editor.getElementByKey(targetNode.getKey());

    if (!elementUnderCursor) {
      return;
    }

    const overlay = ensureHoverOverlay(
      refs.canvasBox.current!,
      elementUnderCursor as HTMLElement,
      refs.breakpoint.current.scale
    );
    refs.mouseOverElement.current = overlay;
    refs.mouseOverNode.current = targetNode;
  };

  const onMouseDown = (event: MouseEvent) => {
    if (refs.mouseToolState.current !== "idle") return;
    if (!refs.mouseOverNode.current) return;

    refs.mouseToolState.current = "mousedown";

    const overlay = refs.mouseOverElement.current;
    if (overlay) {
      const startLeft = overlay.style.left
        ? parsePx(overlay.style.left)
        : overlay.getBoundingClientRect().left + window.scrollX;
      const startTop = overlay.style.top
        ? parsePx(overlay.style.top)
        : overlay.getBoundingClientRect().top + window.scrollY;
      refs.dragStart.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startLeft,
        startTop,
      };
    }
  };

  return { onMouseMove, onMouseDown };
};
