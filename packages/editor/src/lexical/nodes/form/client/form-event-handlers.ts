import { LexicalNode } from "lexical";
import {
  DragDropValidator,
  DropEventHandler,
} from "../../../../client/drag-drop/types";
import { $isTemplateTextNode } from "../../template-text/TemplateTextNode";
import { $isFieldSetNode } from "../FieldSetNode";

import { $isFormNode } from "../FormNode";

import {
  $buildFormElements,
  $buildFormHandlerNode,
  $buildInputElements,
  $isFormRelatedNode,
} from "../input";
import { $isInputNode } from "../InputNode";
import { $isInputWrapperNode, InputWrapperNode } from "../InputWrapperNode";
import { $isLabelNode } from "../LabelNode";
import { $createLegendNode, $isLegendNode } from "../LegendNode";
import { logger } from "../../../logger";

export const formDragDropValidator: DragDropValidator = (args) => {
  const { isNew, dragged, editor, targetNode, position } = args;

  if (!isNew && $isLegendNode(dragged)) {
    // Legend node is not movable once placed
    logger.log("Legend node cannot be moved once placed");
    return [false, "Legend node cannot be moved once placed"];
  }

  const draggedNode = dragged as LexicalNode;

  // Check existing node being dragged
  // If node is in the form, it can only be dropped within the same form
  if (!isNew) {
    // Check if dragged node is in form node
    const draggedFormNode = draggedNode.getParents().find($isFormNode);

    // Check further only if dragged node is in form node
    if (draggedFormNode) {
      const targetFormNode = $isFormNode(targetNode)
        ? targetNode
        : targetNode.getParents().find($isFormNode);

      if (
        draggedFormNode?.getKey() !== targetFormNode?.getKey() ||
        ($isFormNode(targetNode) &&
          position !== "center-bottom" &&
          position !== "center-top")
      ) {
        logger.log(
          "Dragged node cannot be dropped outside of the form it belongs to"
        );

        return [
          false,
          "Dragged node cannot be dropped outside of the form it belongs to",
        ];
      }
    }
  }

  // Check for message node (TemplateTextNode) which isn't removable
  // and movable only within the form it belongs to
  if (!isNew && $isTemplateTextNode(draggedNode)) {
    // Check if the className matches the form's message className
    const formNode = draggedNode.getParents().find($isFormNode);
    if (
      formNode &&
      draggedNode.__css.getClassName() === formNode.__messageClassName
    ) {
      // Ensure that the message node is in the same form node
      const targetFormNode = $isFormNode(targetNode)
        ? targetNode
        : targetNode.getParents().find($isFormNode);

      if (!targetFormNode || formNode.getKey() !== targetFormNode.getKey()) {
        logger.log(
          "Message node cannot be moved outside of the form it belongs to"
        );
        return [
          false,
          "Message node cannot be moved outside of the form it belongs to",
        ];
      }
    }
  }

  // form related node can only be dropped inside the same form node
  if (!isNew && $isFormRelatedNode(draggedNode)) {
    const draggedInputWrapperNode = draggedNode
      .getParents()
      .find($isInputWrapperNode);
    const targetInputWrapperNode = $isInputWrapperNode(targetNode)
      ? targetNode
      : targetNode.getParents().find($isInputWrapperNode);

    if (
      draggedInputWrapperNode?.getKey() !== targetInputWrapperNode?.getKey() ||
      ($isInputWrapperNode(targetNode) &&
        position !== "center-bottom" &&
        position !== "center-top")
    ) {
      logger.log(
        "Form related nodes can only be moved within the same input wrapper"
      );
      return [
        false,
        "Form related nodes can only be moved within the same input wrapper",
      ];
    }
  }

  // non input wrapper nodes cannot be dropped on form related nodes
  if (
    isNew &&
    dragged.getType() !== "form-input-wrapper" &&
    !$isFormRelatedNode(dragged) &&
    ($isFormRelatedNode(targetNode) || $isInputWrapperNode(targetNode))
  ) {
    logger.log("Dragged node can only be dropped on form related nodes");
    return [false, "Dragged node can only be dropped on form related nodes"];
  }

  if (isNew && dragged.getType() === "form-input-wrapper") {
    // For new nodes, allow drop only on form nodes
    const formNode = $isFormNode(targetNode)
      ? targetNode
      : targetNode.getParents().find($isFormNode);

    if (!formNode) {
      logger.log("New node can only be dropped inside a form node");

      return [false, "New node can only be dropped inside a form node"];
    }
  }

  // New Label node can be dropped only if input wrapper node doesn't have one. (it has been removed)
  if (isNew && dragged.getType() === "form-label") {
    // Label node must be dropped within input wrapper node
    if (!$isInputWrapperNode(targetNode)) {
      logger.log(
        "New label node can only be dropped inside an input wrapper node"
      );
      return [
        false,
        "New label node can only be dropped inside an input wrapper node",
      ];
    }

    // Check if target input wrapper node already has a label node
    const hasLabelNode = targetNode
      .getChildren()
      .some((child) => $isLabelNode(child));

    if (hasLabelNode) {
      logger.log(
        "New label node cannot be dropped because the input wrapper node already has a label"
      );
      return [
        false,
        "New label node cannot be dropped because the input wrapper node already has a label",
      ];
    }

    return [true, targetNode];
  }

  // any node except label node (above) cannot be dropped into input wrapper node
  if (
    $isInputWrapperNode(targetNode) &&
    dragged.getType() !== "form-label" &&
    position !== "top" &&
    position !== "bottom"
  ) {
    logger.log("Only label nodes can be dropped into input wrapper nodes");
    return [false, "Only label nodes can be dropped into input wrapper nodes"];
  }

  // All new nodes cannot be dropped into input nodes or label nodes.
  // Note: there's exception for label node above.
  if (isNew && ($isInputNode(targetNode) || $isLabelNode(targetNode))) {
    logger.log("Nodes cannot be dropped into input nodes");
    return [false, "Nodes cannot be dropped into input nodes"];
  }

  if ($isInputNode(targetNode) && position !== "top" && position !== "bottom") {
    logger.log("Nodes cannot be dropped inside input nodes");
    return [false, "Nodes cannot be dropped inside input nodes"];
  }

  if (!isNew && ($isInputNode(targetNode) || $isLabelNode(targetNode))) {
    // Ensure dragged node is in the same input wrapper
    const draggedInputWrapperNode = draggedNode
      .getParents()
      .find($isInputWrapperNode);
    const targetInputWrapperNode = targetNode
      .getParents()
      .find($isInputWrapperNode);

    if (
      draggedInputWrapperNode?.getKey() !== targetInputWrapperNode?.getKey()
    ) {
      logger.log(
        "Nodes cannot be moved into input nodes outside of the same input wrapper"
      );
      return [
        false,
        "Nodes cannot be moved into input nodes outside of the same input wrapper",
      ];
    }
  }

  return [true, targetNode];
};

export const formPostDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, draggedNode, isNew, position, editor } = args;

  if (isNew && $isFormNode(draggedNode)) {
    $buildFormElements(draggedNode);
  }

  // Build form handler node for the form
  if (isNew && $isFormNode(draggedNode)) {
    $buildFormHandlerNode(draggedNode);
  }

  if ($isInputWrapperNode(draggedNode)) {
    // get the form node
    const formNode = $isFormNode(targetNode)
      ? targetNode
      : targetNode.getParents().find($isFormNode);

    // This should never happen due to the drag drop validator but just in case
    if (!formNode) {
      logger.log("Form Element Nodes not found");
      return true;
    }
  }

  if (isNew && $isInputWrapperNode(draggedNode)) {
    // For new input wrapper nodes, build input elements with text type by default
    $buildInputElements(draggedNode, "text");
  }

  if (isNew && $isFieldSetNode(draggedNode)) {
    // For new fieldset nodes, add a legend node by default
    // First check if legend node already exists
    const existingLegendNode = draggedNode.getChildren().find($isLegendNode);

    if (!existingLegendNode) {
      const LegendNode = $createLegendNode();
      draggedNode.append(LegendNode);
    }
  }

  return false;
};
