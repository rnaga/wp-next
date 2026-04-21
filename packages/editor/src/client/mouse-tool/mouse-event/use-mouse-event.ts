import { useCallback, useRef } from "react";
import { $getNodeFromDOM } from "../../../lexical";
import { LexicalNode } from "lexical";
import { usePreviewLayer } from "../../preview-layer";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useBreakpoint } from "../../breakpoint";
import { useDragDrop } from "../../drag-drop";
import { useGlobalEvent, useSelectedNode } from "../../global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useMouseTool } from "../MouseToolContext";
import { getClientXYPosition, syncStyles } from "../dom";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { createMouseHandlers } from "./create-mouse-handlers";
import { createDragHandlers } from "./handlers/drag-handlers";
import { createScrollHandlers } from "./handlers/scroll-handlers";
import { createPointerHandlers } from "./handlers/pointer-handlers";

export type ListenerTuple = [keyof HTMLElementEventMap, (event: any) => void];

export const useMouseEvent = () => {
  const [editor] = useLexicalComposerContext();
  const { canvasBoxRef, eventBoxRef, mouseToolState, dragging, wheelMode } =
    useMouseTool();
  const { iframeRef } = usePreviewLayer();
  const { wpHooks } = useWP();
  const { breakpointRef } = useBreakpoint();
  const { setSelectedNode } = useSelectedNode();
  const dragDrop = useDragDrop();
  const {
    globalEvent: { updateFocusOnSelectedNode },
  } = useGlobalEvent();

  const mouseOverElementRef = useRef<HTMLElement | null>(null);
  const mouseOverNodeRef = useRef<LexicalNode | null>(null);
  const draggedOverElementRef = useRef<HTMLElement | null>(null);
  const scrollAtTheBottom = useRef(false);
  const isScrolling = useRef(false);
  const isPanning = useRef(false);
  const dragStartRef = useRef<any>(null);

  const getNodeOnMouse = (
    event: MouseEvent,
    options?: {
      editableMouseToolOnly?: boolean;
      editableContextMenuOnly?: boolean;
      removableOnly?: boolean;
    }
  ) => {
    const {
      editableMouseToolOnly = false,
      editableContextMenuOnly = false,
      removableOnly = false,
    } = options || {};
    const iframe = iframeRef.current!;
    const { clientX, clientY } = getClientXYPosition({
      event,
      iframe,
      scale: breakpointRef.current.scale,
    });

    const elementsUnderCursor = iframe.contentDocument?.elementsFromPoint(
      clientX,
      clientY
    );
    if (elementsUnderCursor?.length) {
      for (const elementUnderCursor of elementsUnderCursor) {
        const targetNode = editor.read(() =>
          $getNodeFromDOM(elementUnderCursor as Element, editor)
        ) as WPLexicalNode | null;
        if (
          !targetNode ||
          (editableMouseToolOnly && !targetNode.__editableMouseTool) ||
          (editableContextMenuOnly && !targetNode.__editableContextMenu) ||
          (removableOnly && !targetNode.__removable)
        ) {
          continue;
        }
        return targetNode;
      }
    }
    return null;
  };

  const clearDraggedOverlay = useCallback(() => {
    if (draggedOverElementRef.current) {
      draggedOverElementRef.current.style.setProperty("display", "none");
      draggedOverElementRef.current = null;
    }
  }, []);

  const syncCanvasStyles = useCallback(() => {
    if (!iframeRef.current || !eventBoxRef.current) return;
    syncStyles({
      iframe: iframeRef.current,
      targetBox: eventBoxRef.current,
      container: null,
      scale: breakpointRef.current.scale,
    });
    eventBoxRef.current.style.setProperty("position", "absolute");
  }, [iframeRef, breakpointRef, eventBoxRef]);

  const getListeners = useCallback((): ListenerTuple[] => {
    const mouseHandlers = createMouseHandlers({
      editor,
      dragDrop,
      refs: {
        canvasBox: canvasBoxRef,
        iframe: iframeRef,
        breakpoint: breakpointRef,
        mouseToolState,
        mouseOverElement: mouseOverElementRef,
        mouseOverNode: mouseOverNodeRef,
        draggedOverElement: draggedOverElementRef,
        dragStart: dragStartRef,
      },
      onStartDragging: (ev, node) => dragging.start(ev, node),
      onEndDragging: (ev) => dragging.end(ev),
      getNodeOnMouse,
    });

    const { onDragOver, onDragEnd, onDragLeave } = createDragHandlers({
      editor,
      dragDrop,
      iframeRef,
      canvasBoxRef,
      breakpointRef,
      draggedOverElementRef,
      clearDraggedOverlay,
    });

    const { onWheel } = createScrollHandlers({
      wpHooks,
      breakpointRef,
      isScrolling,
      scrollAtTheBottom,
      wheelModeRef: wheelMode.enabledRef,
      isPanningRef: isPanning,
    });

    const { onMouseMove, onMouseDown, onMouseUp, onMouseLeave, onClick, onContextMenu } =
      createPointerHandlers({
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
      });

    return [
      ["mousemove", onMouseMove],
      ["dragover", onDragOver],
      ["dragend", onDragEnd],
      ["dragleave", onDragLeave],
      ["mousedown", onMouseDown],
      ["mouseup", onMouseUp],
      ["mouseleave", onMouseLeave],
      ["wheel", onWheel],
      ["click", onClick],
      ["contextmenu", onContextMenu],
    ] as ListenerTuple[];
  }, [
    editor,
    dragDrop,
    canvasBoxRef,
    iframeRef,
    breakpointRef,
    mouseToolState,
    dragging,
    setSelectedNode,
    clearDraggedOverlay,
    wpHooks,
  ]);

  return {
    getListeners,
    eventBoxRef,
    syncCanvasStyles,
    iframeRef,
  };
};
