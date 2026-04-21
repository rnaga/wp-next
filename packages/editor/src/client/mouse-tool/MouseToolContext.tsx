import {
  createContext,
  useContext,
  RefObject,
  useState,
  useRef,
  useEffect,
} from "react";
import { useNodeEvent } from "../node-event";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { useSelectedNode } from "../global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDragDrop } from "../drag-drop";
import { $isChildOfNode } from "../../lexical";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  CANVAS_WHEEL_MODE_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_TOGGLE_COMMAND,
} from "./commands";

export type MouseToolState =
  | "idle"
  | "mouseover"
  | "mousedown"
  | "mouseup"
  | "resizing"
  | "dragging"
  | "contextmenu";

export const Context = createContext<{
  canvasBoxRef: RefObject<HTMLElement | null>;
  eventBoxRef: RefObject<HTMLElement | null>;
  toolBoxRef: RefObject<HTMLDivElement | null>;
  mouseToolState: RefObject<MouseToolState>;

  toolbox: {
    isOpen: (node: WPLexicalNode | null) => boolean;
    openRef: RefObject<boolean>;
    open: boolean;
    updateOpen: (open: boolean, node?: WPLexicalNode) => void;
  };
  dragging: {
    start: (e: React.MouseEvent, node: WPLexicalNode) => void;
    end: (e: MouseEvent) => void;
    isNodeDragged: (node: WPLexicalNode | null) => boolean;
    isDragging: boolean;
    setDraggedNode: (node: WPLexicalNode | null) => void;
    draggedPreviewElementRef: RefObject<HTMLElement | null>;
  };
  wheelMode: {
    isEnabled: boolean;
    enabledRef: RefObject<boolean>;
    toggle: () => void;
  };
  panOffsetRef: RefObject<{ x: number; y: number }>;
}>({} as any);

export const useMouseTool = () => {
  return useContext(Context);
};

export const MouseToolContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const [draggedNode, setDraggedNode] = useState<WPLexicalNode | null>(null);
  const draggedPreviewElementRef = useRef<HTMLElement | null>(null);
  const { setSelectedNode, selectedNode } = useSelectedNode();

  const canvasBoxRef = useRef<HTMLElement>(null);
  const toolBoxRef = useRef<HTMLDivElement>(null);
  const eventBoxRef = useRef<HTMLElement>(null);

  const mouseToolState = useRef<MouseToolState>("idle");

  const [editor] = useLexicalComposerContext();
  const dragDrop = useDragDrop();

  const { getParameters } = useNodeEvent();

  const [openToolbox, setOpenToolbox] = useState(false);
  const openToolboxRef = useRef(false);

  const [wheelModeEnabled, setWheelModeEnabled] = useState(true);
  const wheelModeEnabledRef = useRef(true);
  // Tracks accumulated wheel-pan translation. Mutated by use-toolbox-overlay's
  // CANVAS_WHEEL_MODE_MOVE_COMMAND handler (the sole writer) so it is always
  // current when applyCanvasBoxPosition reads it synchronously.
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const { wpHooks } = useWP();

  const toggleWheelMode = () => {
    const next = !wheelModeEnabledRef.current;
    wheelModeEnabledRef.current = next;
    setWheelModeEnabled(next);
    wpHooks.action.doCommand(CANVAS_WHEEL_MODE_CHANGED_COMMAND, {
      enabled: next,
    });
  };

  useEffect(() => {
    return wpHooks.action.addCommand(CANVAS_WHEEL_MODE_TOGGLE_COMMAND, () => {
      toggleWheelMode();
    });
  }, [wpHooks]);

  // Notify all subscribers of the initial enabled state on mount.
  useEffect(() => {
    wpHooks.action.doCommand(CANVAS_WHEEL_MODE_CHANGED_COMMAND, {
      enabled: true,
    });
  }, [wpHooks]);

  const updateOpenToolbox = (open: boolean, node?: WPLexicalNode) => {
    setOpenToolbox(open);
    openToolboxRef.current = open;

    if (open) {
      setSelectedNode(node);
    } else {
      setSelectedNode(undefined);
    }
  };

  const startDragging = (e: React.MouseEvent, node: WPLexicalNode) => {
    const previewElement = editor.read(() =>
      editor.getElementByKey(node.getKey())
    );
    draggedPreviewElementRef.current = previewElement;

    const args = getParameters({
      nodeKey: node.getKey(),
      event: e as unknown as Event,
      element: previewElement,
    });

    // Set the dragged node before starting the drag
    dragDrop.setDragged(node.getKey(), e as unknown as MouseEvent, {
      ...args,
      isScaled: true,
    });

    // Notify the dragDrop that the dragging has started
    dragDrop.startDragging(
      getParameters({
        nodeKey: node.getKey(),
        event: e as unknown as Event,
        element: previewElement,
      })
    );
  };

  const endDragging = (e: MouseEvent) => {
    draggedPreviewElementRef.current = null;

    const dragged = dragDrop.get().dragged;

    if (dragged.isNew || !dragged.dragging) {
      return;
    }
    const element = dragged.element.current!;
    const node = dragged.nodeOrKlass as WPLexicalNode;

    const args = getParameters({
      event: e,
      element,
      nodeKey: node?.getKey(),
    });

    dragDrop.end(args);
  };

  const isNodeDragged = (node: WPLexicalNode | null) => {
    if (!node || !draggedNode) {
      return false;
    }
    if (draggedNode.getKey() === node.getKey()) {
      return true;
    }

    return editor
      .getEditorState()
      .read(() => $isChildOfNode(node, draggedNode));
  };

  const isToolboxOpen = (node: WPLexicalNode | null) => {
    if (!node || !selectedNode) {
      return false;
    }

    if (selectedNode.getKey() === node.getKey()) {
      return openToolboxRef.current;
    }

    return editor
      .getEditorState()
      .read(() => $isChildOfNode(node, selectedNode));
  };

  return (
    <Context
      value={{
        canvasBoxRef,
        eventBoxRef,
        toolBoxRef,
        mouseToolState,
        toolbox: {
          isOpen: isToolboxOpen,
          openRef: openToolboxRef,
          open: openToolbox,
          updateOpen: updateOpenToolbox,
        },
        dragging: {
          start: startDragging,
          end: endDragging,
          isNodeDragged,
          isDragging: !!draggedNode,
          setDraggedNode,
          draggedPreviewElementRef,
        },
        wheelMode: {
          isEnabled: wheelModeEnabled,
          enabledRef: wheelModeEnabledRef,
          toggle: toggleWheelMode,
        },
        panOffsetRef,
      }}
    >
      {children}
    </Context>
  );
};
