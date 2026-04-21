import { COMMAND_PRIORITY_HIGH } from "lexical";
import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  NODE_DRAG_END_COMMAND,
  NODE_POST_DRAG_END_COMMAND,
} from "../node-event/commands";
import { $dropEventHandler } from "./drop-event-handler";
import { useDragDrop } from "./use-drag-drop";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  WP_DRAG_END_WITH_ERROR_COMMAND,
  WP_DRAG_OUT_WITH_ERROR_COMMAND,
} from "./commands";

export const DragDropEditorPlugin = () => {
  const dragDrop = useDragDrop();
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  useEffect(() => {
    return editor.registerCommand(
      NODE_DRAG_END_COMMAND,
      (args) => {
        const active = dragDrop.get();
        const [success, error] = $dropEventHandler(active, editor);
        setTimeout(() => {
          if (!success && error) {
            wpHooks.action.doCommand(WP_DRAG_END_WITH_ERROR_COMMAND, { error });
          } else {
            wpHooks.action.doCommand(NODE_POST_DRAG_END_COMMAND, args);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [wpHooks]);

  return null;
};
