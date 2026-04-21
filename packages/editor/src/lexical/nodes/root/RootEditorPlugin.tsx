import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { use, useEffect } from "react";
import { useDragDrop } from "../../../client/drag-drop";

export const RootEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const dragDrop = useDragDrop();

  useEffect(() => {
    return editor.registerRootListener((rootElement, prevRootElement) => {
      rootElement?.addEventListener("drop", (e) => {
        e.preventDefault();
      });

      rootElement?.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
    });
  }, []);

  return null;
};
