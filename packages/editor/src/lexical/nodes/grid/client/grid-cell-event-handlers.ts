import { LexicalNode } from "lexical";
import {
  DragDropValidator,
  DropEventHandler,
} from "../../../../client/drag-drop/types";
import { $isGridCellNode, GridCellNode } from "../GridCellNode";
import { $canSwapGridCells, $isGridNode, $swapGridCells } from "../GridNode";
import { logger } from "../../../logger";

export const gridDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode, position } = args;

  // Return false when
  // - target node is Grid Node
  // - position is not top or bottom
  // This is to prevent any node from being dropped into a grid node
  if ($isGridNode(targetNode) && position !== "top" && position !== "bottom") {
    logger.log( "Node cannot be dropped into a grid node", position);
    return [false, "Node cannot be dropped into a grid node"];
  }

  return [true, args.targetNode];
};

export const gridCellDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode, position } = args;

  // Return false if target node is grid cell and the position isn't center-top or center-bottom
  // This is to prevent non grid cell from being dropped into a grid node
  // (i.e. grid cell can only be added inside a grid node)
  if (
    $isGridCellNode(targetNode) &&
    position !== "center-top" &&
    position !== "center-bottom"
  ) {
    return [false, "Node cannot be dropped into a grid cell at this position"];
  }

  const draggedNode = dragged as LexicalNode;

  // - Grid cell can only be created inside a grid node
  // - Skip if dragged node is not a grid cell node
  if (isNew || !$isGridCellNode(draggedNode)) {
    return [true, targetNode];
  }

  const draggedParentGridNode = draggedNode.getParents().find($isGridNode);

  if (!draggedParentGridNode) {
    logger.log( "Dragged node is not in a grid node");
    return [false, "Dragged node is not in a grid node"];
  }

  const targetParentGridNode = $isGridNode(targetNode)
    ? targetNode
    : targetNode?.getParents().find($isGridNode);

  if (
    !targetParentGridNode ||
    draggedParentGridNode.getKey() !== targetParentGridNode.getKey()
  ) {
    logger.log( "Dragged node cannot be dropped outside of the grid node");
    return [false, "Dragged node cannot be dropped outside of the grid node"];
  }

  // Make sure target node is a grid cell node
  const targetGridCellNode = $isGridCellNode(targetNode)
    ? targetNode
    : editor.read(() => targetNode.getParents().find($isGridCellNode));

  if (!targetGridCellNode) {
    logger.log(
      "Target node is neither a grid cell nor a child of a grid cell"
    );
    return [
      false,
      "Target node is neither a grid cell nor a child of a grid cell",
    ];
  }

  const draggedGridCellNode = draggedNode as GridCellNode;

  const canSwap = editor.read(() =>
    $canSwapGridCells(draggedGridCellNode, targetGridCellNode)
  );

  if (!canSwap) {
    logger.log( "Cannot swap grid cells");
    return [false, "Cannot swap grid cells"];
  }

  return [true, targetGridCellNode];
};

// Event when a node is dropped into a collection
export const gridCellDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, dragged, isNew, position, editor } = args;
  const draggedNode = dragged as LexicalNode;

  if (isNew || !$isGridCellNode(targetNode) || !$isGridCellNode(draggedNode)) {
    return false;
  }

  const targetGridCellNode = targetNode as GridCellNode;
  const draggedGridCellNode = draggedNode as GridCellNode;

  editor.update(
    () => {
      $swapGridCells(editor, draggedGridCellNode, targetGridCellNode);
    },
    {
      discrete: true,
    }
  );

  return true;
};
