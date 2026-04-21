import { DragDropValidator } from "../../../../client/drag-drop/types";

import { $isBodyNode } from "../BodyNode";
import { logger } from "../../../logger";

export const bodyDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode, position } = args;

  if (
    $isBodyNode(targetNode) &&
    (position === "top" || position === "bottom")
  ) {
    logger.log("Node can only be dropped inside body node");
    return [false, undefined];
  }

  return [true, targetNode];
};
