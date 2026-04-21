import {
  DragDropValidator,
  DropEventHandler,
} from "../../../../client/drag-drop/types";
import { $createTemplateTextNode } from "../../template-text/TemplateTextNode";
import { $isLinkNode } from "../LinkNode";

export const linkPostDropEventHandler: DropEventHandler = (args) => {
  const { targetNode, draggedNode, isNew, position, editor } = args;

  // Initially populate new link nodes with some text
  if (isNew && $isLinkNode(draggedNode) && draggedNode.isEmpty()) {
    const writable = draggedNode.getWritable();

    writable.__css.set({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
      __layout: {
        display: "block",
      },
    });

    const textNode = $createTemplateTextNode();
    textNode.setTemplate("New Link");
    textNode.loadText();
    writable.append(textNode);
  }

  return true;
};
