import { $getRoot, LexicalEditor } from "lexical";
import type React from "react";
import type { useDragDrop } from "../../../drag-drop";
import type { useBreakpoint } from "../../../breakpoint";
import { createDragTargetOverlay } from "../../dom";

type DragHandlerDeps = {
  editor: LexicalEditor;
  dragDrop: ReturnType<typeof useDragDrop>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  canvasBoxRef: React.RefObject<HTMLElement | null>;
  breakpointRef: ReturnType<typeof useBreakpoint>["breakpointRef"];
  draggedOverElementRef: React.RefObject<HTMLElement | null>;
  clearDraggedOverlay: () => void;
};

export const createDragHandlers = (deps: DragHandlerDeps) => {
  const {
    editor,
    dragDrop,
    iframeRef,
    canvasBoxRef,
    breakpointRef,
    draggedOverElementRef,
    clearDraggedOverlay,
  } = deps;

  const onDragOver = (event: DragEvent) => {
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    event.preventDefault();
    event.stopPropagation();
    clearDraggedOverlay();

    const result = dragDrop.checkElementsUnderCursorAndSetTarget({
      contentDocument: iframeRef.current!.contentDocument!,
      event,
    });

    if (result[0] === true) {
      const [, targetElementOrFlag, position] = result as any;
      if (targetElementOrFlag) {
        const rect = (targetElementOrFlag as HTMLElement).getBoundingClientRect();
        const overlay = createDragTargetOverlay(
          rect,
          canvasBoxRef.current!,
          breakpointRef.current.scale,
          position
        );
        draggedOverElementRef.current = overlay;
      }
      return;
    }

    const [, isOverItself] = result as any;
    if (!isOverItself) {
      let rootKey: string | undefined;
      editor.read(() => {
        rootKey = $getRoot().getKey();
      });
      if (rootKey) {
        dragDrop.setTarget(rootKey, event as any);
      }
    }
  };

  const onDragEnd = (event: DragEvent) => {
    event.preventDefault();
    clearDraggedOverlay();
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDrop.setTarget(undefined, event as unknown as MouseEvent);
  };

  return { onDragOver, onDragEnd, onDragLeave };
};
