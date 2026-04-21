import { $getNodeByKey, PASTE_TAG, REDO_COMMAND, UNDO_COMMAND } from "lexical";

import { GlobalEventHandler, GlobalEventHandlerParameters } from "./types";
import {
  $copyNodeMenuHandler,
  $cutNodeMenuHandler,
  $deleteNodeMenuHandler,
  $pasteNodeMenuHandler,
  openRootContextMenu,
} from "../keys-menu";
import { lexicalHistoryState } from "../../lexical";
import { NODE_PROPERTY_UPDATED } from "../node-event";
import { NODE_CSS_UPDATED_COMMAND } from "../../lexical/commands";

export const mouseMoveEventHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const { globalEvent, event } = args;
  const { mousePosition } = globalEvent;
  const mouseEvent = event as MouseEvent;

  mousePosition.current = {
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
  };
};

export const clickEventHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const { globalEvent, editor } = args;
  const { updateFocusOnSelectedNode } = globalEvent;
  // Unfocus the selected node when clicking outside the node.
  updateFocusOnSelectedNode(false);
};

export const contextMenuEventHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const { editor, event } = args;

  event.preventDefault();

  openRootContextMenu(editor, event as unknown as React.MouseEvent);
};

const dispatchNodeUpdateAfterHistoryChange = (
  editor: GlobalEventHandlerParameters["editor"],
  selectedNodeRef: GlobalEventHandlerParameters["globalEvent"]["selectedNodeRef"]
) => {
  if (selectedNodeRef.current.node) {
    setTimeout(() => {
      const latestNode = editor.read(() =>
        selectedNodeRef.current.node!.getLatest()
      );
      const styles = editor.read(() => latestNode?.__css.get() || {});

      editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
        node: latestNode,
      });

      editor.dispatchCommand(NODE_CSS_UPDATED_COMMAND, {
        node: latestNode,
        styles,
        type: "keyboard",
      });
    }, 50);
  }
};

export const keydownEventHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const {
    editor,
    event,
    globalEvent: { selectedNodeRef },
  } = args;
  const keyEvent = event as KeyboardEvent;

  // Handle undo/redo OUTSIDE editor.update() to avoid interfering with history state.
  // Always return early for undo/redo keys to prevent the editor.update() below
  // from running, which could create spurious history entries.
  // Only dispatch when Lexical's core hasn't already handled the event
  // (Lexical calls event.preventDefault() before dispatching undo/redo).

  // Redo
  if (
    (keyEvent.ctrlKey || keyEvent.metaKey) &&
    (keyEvent.key.toLowerCase() === "y" ||
      (keyEvent.shiftKey && keyEvent.key.toLowerCase() === "z"))
  ) {
    if (
      !keyEvent.defaultPrevented &&
      lexicalHistoryState.redoStack.length > 0
    ) {
      keyEvent.preventDefault();
      editor.dispatchCommand(REDO_COMMAND, undefined);
      dispatchNodeUpdateAfterHistoryChange(editor, selectedNodeRef);
    }
    return;
  }

  // Undo
  if ((keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key === "z") {
    if (
      !keyEvent.defaultPrevented &&
      lexicalHistoryState.undoStack.length > 0
    ) {
      keyEvent.preventDefault();
      editor.dispatchCommand(UNDO_COMMAND, undefined);
      dispatchNodeUpdateAfterHistoryChange(editor, selectedNodeRef);
    }
    return;
  }

  editor.update(
    () => {
      // Check if the selected node is focused.
      if (!selectedNodeRef.current.focus) {
        return;
      }

      const nodeKey = selectedNodeRef.current.node?.getKey();
      const node = !nodeKey ? undefined : $getNodeByKey(nodeKey);

      if (keyEvent.ctrlKey || keyEvent.metaKey) {
        switch (keyEvent.key) {
          case "c": // Copy
            $copyNodeMenuHandler(args);
            break;
          case "v": // Paste
            $pasteNodeMenuHandler(args);
            break;
          case "x": // Cut
            $cutNodeMenuHandler(args);
            break;
        }
      } else if (keyEvent.key === "Delete" || keyEvent.key === "Backspace") {
        $deleteNodeMenuHandler(args);
      }
    },
    {
      discrete: true,
      ...(keyEvent?.key ? { tag: PASTE_TAG } : {}),
    }
  );
};
