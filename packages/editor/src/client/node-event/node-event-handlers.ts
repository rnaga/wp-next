import { $getNodeByKey, EventHandler } from "lexical";
import { CONTEXT_MENU_COMMAND } from "../keys-menu";
import { logger } from "../../lexical/logger";

import {
  NODE_CLICKED_COMMAND,
  NODE_CREATED_COMMAND,
  NODE_DESTROYED_COMMAND,
  NODE_UPDATED_COMMAND,
} from "./commands";
import { openNodeContextMenu } from "../keys-menu/NodeContextMenu";
import {
  NodeEventHandler,
  NodeEventHandlers,
  NodeMutationEventHandler,
} from "./types";
import { WPLexicalNode } from "../../lexical/nodes/wp";

export const events = [
  "click",
  "contextmenu",
  "mousemove",
  "node-created",
  "node-updated",
  "node-destroyed",
] as const;

export const clickEventHandler: NodeEventHandler = (args) => {
  const {
    event,
    element,
    nodeKey,
    editor,
    globalEvent: { setSelectedNode },
  } = args;
  if (!element) {
    return;
  }
  // Prevent the click event from propagating to the parent element
  event.stopPropagation();
  event.preventDefault();

  editor.dispatchCommand(NODE_CLICKED_COMMAND, args);

  const node = editor.read(() => $getNodeByKey(nodeKey));
  if (!node) {
    return;
  }

  setSelectedNode(node as WPLexicalNode);
};

export const contextMenuEventHandler: NodeEventHandler = (args) => {
  const {
    editor,
    nodeKey,
    event,
    globalEvent: { setSelectedNode },
  } = args;
  const element = editor.getElementByKey(nodeKey);
  event.stopPropagation();

  if (!element) {
    return;
  }

  event.preventDefault();

  editor.read(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node) {
      logger.log("No node found for nodeKey", nodeKey);
      return;
    }
    openNodeContextMenu(editor, node, event as unknown as React.MouseEvent);

    setSelectedNode(node as WPLexicalNode);
  });
};

export const nodeUpdatedEventHandler: NodeMutationEventHandler = (args) => {
  const { editor, nodeKey } = args;

  editor.dispatchCommand(NODE_UPDATED_COMMAND, args);
};

export const nodeCreatedEventHandler: NodeMutationEventHandler = (args) => {
  const { editor, nodeKey } = args;
  logger.log("node-created", nodeKey);

  editor.dispatchCommand(NODE_CREATED_COMMAND, args);
};

export const nodeDestroyedEventHandler: NodeMutationEventHandler = (args) => {
  const {
    editor,
    nodeKey,
    globalEvent: { setSelectedNode, selectedNodeRef },
  } = args;
  logger.log("node-destroyed", nodeKey);

  editor.dispatchCommand(NODE_DESTROYED_COMMAND, args);

  // Unset selected node if it is destroyed
  if (selectedNodeRef.current?.node?.getKey() === nodeKey) {
    setSelectedNode();
  }
};

export const eventHandlers = (): NodeEventHandlers => ({
  "node-updated": nodeUpdatedEventHandler,
  "node-destroyed": nodeDestroyedEventHandler,
  "node-created": nodeCreatedEventHandler,
});
