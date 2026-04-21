"use client";

import { logger } from "../../lexical/logger";
import {
  $createNodeSelection,
  $getNodeByKey,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  HISTORIC_TAG,
} from "lexical";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  createEmptyHistoryState,
  HistoryPlugin,
} from "@lexical/react/LexicalHistoryPlugin";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { lexicalHistoryState } from "../../lexical";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { useBreakpoint } from "../breakpoint";
import { addEventListener } from "../event-utils";
import { NODE_DRAG_START_COMMAND } from "../node-event";
import { useNodeEvent } from "../node-event/use-node-event";
import { WP_UPDATE_FOCUS_ON_SELECTED_NODE_COMMAND } from "./commands";
import {
  clickEventHandler,
  keydownEventHandler,
  mouseMoveEventHandler,
} from "./global-event-handlers";
import { SelectedNodeRef } from "./types";
import { useGlobalEvent } from "./use-global-event";

// Context to store root event handlers state
const Context = createContext<{
  mousePosition: React.RefObject<{ x: number; y: number }>;
  historyState: ReturnType<typeof createEmptyHistoryState>;
  selectedNodeRef: SelectedNodeRef;
  setSelectedNode: (
    node?: WPLexicalNode,
    options?: { focus?: boolean }
  ) => void;
  updateFocusOnSelectedNode: (focus: boolean) => void;
  selectedNode: WPLexicalNode | undefined;
  getLatestSelectedNode: () => WPLexicalNode | undefined;
}>({} as any);

// Custom hook to use root event handlers context
export const useGlobalEventContext = () => {
  const context = useContext(Context);
  return context;
};

export const useSelectedNode = () => {
  const { selectedNode, setSelectedNode, selectedNodeRef } =
    useGlobalEventContext();

  return {
    selectedNode,
    setSelectedNode,
    selectedNodeRef,
  };
};

// Provider component for root event handlers
export const GlobalEventContext = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const mousePosition = useRef({ x: 0, y: 0 });

  const [selectedNode, setSelectedNodeState] = useState<WPLexicalNode>();

  const getLatestSelectedNode = useCallback(() => {
    const nodeKey = selectedNodeRef.current.node?.getKey();
    if (!nodeKey) return undefined;
    return (
      (editor.read(() => $getNodeByKey(nodeKey)) as WPLexicalNode) ?? undefined
    );
  }, [selectedNode]);

  const selectedNodeRef = useRef({
    node: undefined,
    prevNodeKey: undefined,
    focus: false,
    latest: getLatestSelectedNode,
  }) as SelectedNodeRef;

  const setSelectedNode = (
    node?: WPLexicalNode,
    options?: {
      focus?: boolean;
    }
  ) => {
    logger.log("setSelectedNode", node);

    const { focus = true } = options || {};

    // If the node key is undefined, clear the selection.
    if (!node) {
      selectedNodeRef.current.prevNodeKey =
        selectedNodeRef.current.node?.getKey();
      selectedNodeRef.current.node = undefined;

      setSelectedNodeState(undefined);

      editor.update(
        () => {
          const nodeSelection = $createNodeSelection();
          nodeSelection.clear();
          $setSelection(nodeSelection);

          setSelectedNodeState(undefined);
        },
        {
          discrete: true,
          tag: HISTORIC_TAG,
        }
      );
      return;
    }

    // When node key is set, update the selection.
    selectedNodeRef.current.prevNodeKey =
      selectedNodeRef.current.node?.getKey();
    selectedNodeRef.current.focus = focus;
    selectedNodeRef.current.node = node;

    editor.update(
      () => {
        const nodeSelection = $createNodeSelection();
        // Add a node key to the selection.
        // https://lexical.dev/docs/concepts/selection#nodeselection
        nodeSelection.add(node.getKey());
        $setSelection(nodeSelection);

        setSelectedNodeState($getNodeByKey(node.getKey()) as WPLexicalNode);
      },
      {
        discrete: true,
        tag: HISTORIC_TAG,
      }
    );
  };

  const updateFocusOnSelectedNode = (focus: boolean) => {
    wpHooks.action.doCommand(WP_UPDATE_FOCUS_ON_SELECTED_NODE_COMMAND, focus);
    selectedNodeRef.current.focus = focus;
  };

  return (
    <Context
      value={{
        mousePosition,
        historyState: lexicalHistoryState,
        selectedNodeRef,
        setSelectedNode,
        updateFocusOnSelectedNode,
        selectedNode,
        getLatestSelectedNode,
      }}
    >
      <Container />
      <HistoryPlugin externalHistoryState={lexicalHistoryState} />

      {children}
    </Context>
  );
};

const Container = () => {
  const [editor] = useLexicalComposerContext();
  const globalEvent = useGlobalEvent();
  const nodeEvent = useNodeEvent();
  const breakpoint = useBreakpoint();

  // Define root event handlers
  const globalEventHandlers = {
    mousemove: mouseMoveEventHandler,
    keydown: keydownEventHandler,
    click: clickEventHandler,
  };

  // Disable horizontal scrolling
  useEffect(() => {
    document.body.style.setProperty("overscroll-behavior-x", "none");
  }, []);

  // Register and unregister event handlers
  useEffect(() => {
    const removeEventListeners: VoidFunction[] = [];
    for (const [eventKey, handler] of Object.entries(globalEventHandlers)) {
      const globalEventHandler = (event: Event) => {
        handler(globalEvent.getParameters(event, nodeEvent));
      };
      removeEventListeners.push(
        addEventListener(window, eventKey, globalEventHandler)
      );
    }

    return () => {
      for (const removeEventListener of removeEventListeners) {
        removeEventListener();
      }
    };
  }, [editor, nodeEvent, breakpoint]);

  // Set event when start dragging
  useEffect(() => {
    return editor.registerCommand(
      NODE_DRAG_START_COMMAND,
      () => {
        // Unset selected node when dragging
        globalEvent?.globalEvent?.setSelectedNode(undefined);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return null;
};
