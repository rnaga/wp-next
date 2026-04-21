import { $getRoot, Klass, LexicalNode } from "lexical";
import { useEffect, useRef } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { logger } from "../../lexical/logger";

import { isElementNodeClass } from "../../lexical/lexical";

import { useNodeEvent } from "../node-event";
import { useDragDrop } from "./use-drag-drop";

export const useDroppableArea = () => {
  const dragDrop = useDragDrop();
  const { getParameters } = useNodeEvent();
  const [editor] = useLexicalComposerContext();

  const handleDragOver = (event: DragEvent) => {
    const e = event as unknown as DragEvent;

    //
    // New node selection is dragged over out of all nodes
    //
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    const draggedKlass = dragDrop.get().dragged
      .nodeOrKlass as Klass<LexicalNode>;

    // Set the target to the root node when The dragged node is an element node
    if (draggedKlass && isElementNodeClass(draggedKlass)) {
      logger.log("setting root node as target");
      const rootNode = editor.read(() => $getRoot());
      dragDrop.setTarget(rootNode.getKey(), e);
    } else {
      // Reset the drop target
      dragDrop.setTarget(undefined, e);
    }
  };

  const handleDrop = (event: DragEvent) => {
    const e = event as unknown as DragEvent;

    e.preventDefault();
    e.stopPropagation();

    const {
      target: { node },
    } = dragDrop.get();

    if (!node) {
      return;
    }

    const nodeKey = node.getKey();
    const nodeDOM = editor.read(() => editor.getElementByKey(nodeKey));

    if (!nodeDOM) {
      return;
    }

    const args = getParameters({
      nodeKey: node.getKey(),
      event: e as unknown as MouseEvent,
      element: nodeDOM,
    });

    dragDrop.end(args);
  };

  return {
    handleDragOver,
    handleDrop,
  };
};
