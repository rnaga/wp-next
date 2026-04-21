import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectedNode } from "../../../../client/global-event";
import { $getNodeByKey, COMMAND_PRIORITY_HIGH } from "lexical";
import { $isGridNode, GridNode } from "../GridNode";
import {
  setEditorCSS,
  processEditorCSS,
} from "../../../../lexical/styles/css-editor";

import { $isGridCellNode } from "../GridCellNode";
import { useEffect } from "react";
import { NODE_CSS_UPDATED_COMMAND } from "../../../commands";

export const GridHandler = () => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const updateGridCells = () => {
    if (!selectedNode) return;

    const gridCellNodes = editor.read(() => {
      const gridNode = $getNodeByKey(selectedNode.getKey()) as GridNode;
      if (!gridNode || !$isGridNode(gridNode)) return [];

      return gridNode.getChildren().filter((child) => $isGridCellNode(child));
    });

    // for (const gridCellNode of gridCellNodes) {
    //   setEditorCSS(editor, gridCellNode, {
    //     backgroundColor: "rgba(255, 0, 0, 0.1)",
    //     pointerEvents: "none",
    //   });
    // }
    // processEditorCSS(editor);
  };

  useEffect(() => {
    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ node }) => {
        if (
          selectedNode?.getType() === "grid" &&
          selectedNode?.getKey() === node.getKey()
        ) {
          updateGridCells();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  // useEffect(() => {
  //   removeAllEditorCSS(editor, ["grid-cell"]);
  //   processEditorCSS(editor);
  //   if (selectedNode?.getType() === "grid") {
  //     updateGridCells();
  //     return;
  //   }
  // }, [selectedNode]);

  return null;
};
