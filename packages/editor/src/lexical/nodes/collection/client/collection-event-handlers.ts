import {
  $getNodeByKey,
  HISTORY_MERGE_TAG,
  LexicalEditor,
  LexicalNode,
} from "lexical";

import { eventHandlers } from "../../../../client/node-event";

import { $isCollectionElementNode } from "../CollectionElementNode";
import {
  $isCollectionNode,
  $syncCollectionBroadcast,
  $syncCollectionElementNodesInCollection,
  $syncParentCollections,
  CollectionNode,
} from "../CollectionNode";
import { NodeEventHandlers } from "../../../../client/node-event/types";
import {
  DragDropValidator,
  DropEventHandler,
} from "../../../../client/drag-drop/types";
import {
  processAllWidgets,
  processAllWidgetsSync,
} from "../../widget/WidgetNode";
import { logger } from "../../../logger";

export const collectionEventHandlers: NodeEventHandlers = {
  ...eventHandlers(),
};

export const collectionDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode } = args;

  // Check existing node being dragged
  if (!isNew) {
    const draggedNode = dragged;

    // Check if dragged node is collection node and target node is collection element node of the same collection
    if (
      $isCollectionNode(draggedNode) &&
      $isCollectionElementNode(targetNode) &&
      draggedNode.getKey() === targetNode.getParent()?.getKey()
    ) {
      logger.log(
        "Collection node cannot be dragged into its own collection element"
      );
      return [
        false,
        "Collection node cannot be dragged into its own collection element",
      ];
    }

    // Check if dragged node is in collection element node,
    // then ensure that it is dragged in the same collection element node
    const draggedCollectionElementNode = (draggedNode as LexicalNode)
      ?.getParents()
      .find($isCollectionElementNode);

    if (draggedCollectionElementNode) {
      const targetCollectionElementNode = $isCollectionElementNode(targetNode)
        ? targetNode
        : targetNode?.getParents().find($isCollectionElementNode);

      // Ensure that the dragged node is dragged in the same collection element node
      if (
        !targetCollectionElementNode ||
        draggedCollectionElementNode.getKey() !==
          targetCollectionElementNode.getKey()
      ) {
        logger.log(
          "Dragged node cannot be dropped outside of the collection element node"
        );

        return [
          false,
          "Dragged node cannot be dropped outside of the collection element node",
        ];
      }
    }
  }

  return [true, targetNode];
};

export const collectionDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, draggedNode, isNew, position, editor } = args;

  // Check if targeNode is collection node or collection element node
  // If so, append dragged node to collection element node
  if ($isCollectionNode(targetNode) || $isCollectionElementNode(targetNode)) {
    // If target node is collection node, then find collection element node
    const collectionElementNode = $isCollectionElementNode(targetNode)
      ? targetNode
      : targetNode
          .getChildren()
          .filter($isCollectionElementNode)
          // Make sure that the collection element node is not in another collection
          .find((node) => node.getParent()?.getKey() === targetNode.getKey());

    if (!collectionElementNode) {
      logger.log( "Collection element node not found");
      return false;
    }

    collectionElementNode.append(draggedNode);

    return true;
  }

  return false;
};

export const collectionPostDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, draggedNode, isNew, position, editor } = args;

  // If isNew is true and dragged node is collection node,
  // then call $syncCollectionElementNodesInCollection to create and append collection element nodes
  if (isNew && $isCollectionNode(draggedNode)) {
    // Check if collection node has collection element nodes
    const collectionElementNode = draggedNode
      .getChildren()
      .find($isCollectionElementNode);

    if (collectionElementNode) {
      logger.log( "Collection Element Nodes found");
      return true;
    }

    $syncCollectionElementNodesInCollection(draggedNode, collectionElementNode);

    // Continue on as the dragged node can be in part of another collection node
  }

  // If dragged node is in collection element node, then sync its parent collection
  $syncParentCollections(draggedNode);

  return true;
};

// Event when data name in CollectionNode is updated
export const collectionDataNameUpdatedEventHandler = (payload: {
  node: CollectionNode;
  dataName: string;
  editor: LexicalEditor;
}): boolean => {
  const { node, dataName, editor } = payload;
  if (dataName == node.getDataName()) {
    logger.log( "Data name is the same");
    return true;
  }

  editor.update(
    () => {
      const writable = node.getWritable();
      writable.setDataName(dataName);

      $syncCollectionBroadcast(writable);

      //writable.refreshData();
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return true;
};

export const collectionElementNumberUpdatedEventHandler = (payload: {
  node: CollectionNode;
  elementMaxLength: number;
  editor: LexicalEditor;
}): boolean => {
  const { node, elementMaxLength, editor } = payload;
  if (elementMaxLength == node.getElementMaxLength()) {
    logger.log( "Element max length is the same");
    return true;
  }

  editor.update(
    () => {
      const writable = node.getWritable();
      writable.setElementMaxLength(elementMaxLength);

      // Broadcast changes to collection element nodes (both up and down the tree)
      $syncCollectionBroadcast(writable);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  // Process all widgets after sync to ensure they render with correct data
  // This is crucial for widgets in collections - each cloned widget gets its own
  // nested editor with unique contextData via getDataForThisElement()
  logger.log( "[collectionElementNumberUpdated] Processing all widgets...");
  // processAllWidgets(editor)
  //   .then(() => {
  //     console.log("[collectionElementNumberUpdated] Widgets processed successfully");
  //   })
  //   .catch((error) => {
  //     console.error("[collectionElementNumberUpdated] Error processing widgets:", error);
  //   });
  processAllWidgetsSync(editor);

  return true;
};
