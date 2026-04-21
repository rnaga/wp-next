import {
  $getRoot,
  $isElementNode,
  $isRootNode,
  $isTextNode,
  Klass,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { logger } from "../../lexical/logger";

import { $createNode } from "../../lexical/lexical";
import { ActiveDragDrop } from "./use-drag-drop";

import { DragDropParameters } from "./types";
import { $isWPLexicalNode } from "../../lexical/nodes/wp";
import {
  $processAllWidgetsSync,
  processAllWidgetsSync,
} from "../../lexical/nodes/widget/WidgetNode";
import { $isReactDecoratorNode } from "../../lexical/nodes/react-decorator/ReactDecoratorNode";
import { $isInCollectionElementNode } from "../../lexical/nodes/collection/CollectionElementNode";
import { $syncParentCollections } from "../../lexical/nodes/collection/CollectionNode";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { WP_DRAG_OUT_WITH_ERROR_COMMAND } from "./commands";
import { $getBodyNode, $isBodyNode } from "../../lexical/nodes/body/BodyNode";

export const $dropEventHandler = (
  active: ActiveDragDrop,
  editor: LexicalEditor
) => {
  const { dragged, target, dropHandlers } = active;

  if (!dragged.nodeOrKlass || !target.node) {
    logger.log("No dragged node or klass, or no target node");

    return [false, "No dragged node or klass, or no target node"];
  }

  const draggedNode = dragged.isNew
    ? $createNode(dragged.nodeOrKlass as Klass<LexicalNode>)
    : (dragged.nodeOrKlass as LexicalNode);

  const targetNode = target.node;

  const rootElementNodes = $getRoot().getChildren().filter($isElementNode);
  const lastRootElementNode = rootElementNodes[rootElementNodes.length - 1];
  const firstRootElementNode = rootElementNodes[0];

  // Only Element or Text Node is droppable
  if (!$isWPLexicalNode(targetNode) && !$isRootNode(targetNode)) {
    logger.log("Only WP Lexical Node or Root Node is droppable", targetNode);
    return [false, "Only WP Lexical Node or Root Node is droppable"];
  }

  // Root node is droppable only to Element Node
  if ($isRootNode(targetNode) && !$isElementNode(draggedNode)) {
    logger.log("Root node is droppable only to Element Node");
    return [false, undefined];
  }

  // Check if the target node is the same as the dragged node
  //if (targetNode.__parent == node.__key || targetNode.__key == node.__key) {
  if (targetNode.__key == draggedNode.__key) {
    logger.log("same node ");

    return [false, "Cannot drop on the same node"];
  }

  const handlerArgs = {
    isNew: dragged.isNew,
    dragged: dragged.nodeOrKlass,
    draggedNode,
    targetNode,
    position: target.position,
    editor,
  } as DragDropParameters;

  // Iterate registered drop handlers
  let registeredEventHandlerResult = false;
  for (const { handler, event } of dropHandlers) {
    if (event == "replace" && handler(handlerArgs)) {
      registeredEventHandlerResult = true;
      break;
      //return true;
    }
  }

  if (!registeredEventHandlerResult) {
    if ($isRootNode(targetNode) || $isBodyNode(targetNode)) {
      // If dropping on root node or body node, the node must be addded to the body node. This is because body node is the main container for all other nodes in the editor and dropping directly on root node can cause unexpected layout issues.
      const bodyNode = $getBodyNode();
      bodyNode.append(draggedNode);
    } else if (
      $isElementNode(targetNode) &&
      !dragged.isNew &&
      (draggedNode as LexicalNode).getParent()?.__key ===
        targetNode.getParent()?.__key
    ) {
      /**
       * Sibling drop: dragged and target share the same parent element.
       * top/bottom edge → append INTO the target element (nesting).
       * center-top/center-bottom → insert between siblings (same level).
       */
      if (target.position === "center-top" || target.position === "center-bottom") {
        targetNode.append(draggedNode);
      } else if (target.position === "top") {
        targetNode.insertBefore(draggedNode);
      } else {
        targetNode.insertAfter(draggedNode);
      }
    } else if (
      //$isRootNode(targetNode) ||
      $isElementNode(targetNode) &&
      target.position !== "top" &&
      target.position !== "bottom"
    ) {
      targetNode.append(draggedNode);
    } else if (target.position == "top" || target.position == "center-top") {
      targetNode.insertBefore(draggedNode);
    } else {
      targetNode.insertAfter(draggedNode);
    }
  }

  // Post drop event
  for (const { handler, event } of dropHandlers) {
    if (event == "post") {
      handler(handlerArgs);
    }
  }

  // Process all widgets synchronously after drop to ensure immediate data binding.
  // When a widget is dropped into a collection element with data bindings, the widget
  // needs to be processed synchronously (not deferred) so it receives the current
  // collection context and reflects the correct bound data on initial render.
  if ($isInCollectionElementNode(draggedNode)) {
    $processAllWidgetsSync();
  }

  return [true];
};
