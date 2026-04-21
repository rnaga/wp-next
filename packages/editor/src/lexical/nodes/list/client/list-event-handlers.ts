import {
  DragDropValidator,
  DropEventHandler,
} from "../../../../client/drag-drop/types";
import { $createListItemNode } from "../ListItemNode";
import { $isListNode } from "../ListNode";
import { logger } from "../../../logger";

export const listDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode, position } = args;

  if (dragged.getType() === "list-item" && !$isListNode(targetNode)) {
    logger.log( "List items can only be dropped inside list nodes");
    return [false, "List items can only be dropped inside list nodes"];
  }

  if (dragged.getType() !== "list-item" && $isListNode(targetNode)) {
    logger.log( "Only list items can be dropped into list nodes");
    return [false, "Only list items can be dropped into list nodes"];
  }

  return [true, targetNode];
};

export const listPostDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, draggedNode, isNew, position, editor } = args;

  // If dragged node is a list node, add list items (3) to it
  if (isNew && $isListNode(draggedNode) && draggedNode.isEmpty()) {
    const writable = draggedNode.getWritable();
    for (let i = 0; i < 3; i++) {
      const listItemNode = $createListItemNode();
      writable.append(listItemNode);
    }
  }

  return true;
};
