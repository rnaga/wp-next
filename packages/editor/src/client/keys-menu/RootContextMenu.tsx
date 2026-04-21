import {
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  LexicalEditor,
  PASTE_TAG,
} from "lexical";
import { useEffect, useState } from "react";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Menu } from "@mui/material";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks";

import { useRefresh } from "../refresh";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useTemplate } from "../template/use-template";
import { ROOT_CONTEXT_MENU_COMMAND } from "./commands";
import { $getCopiedNode, $pasteNodeMenuHandler } from "./node-menu-handlers";
import { MenuItem } from "./MenuItem";
import { RootContextMenuEventHandlerParameters } from "./types";
import { useGlobalEvent } from "../global-event/use-global-event";
import { useNodeEvent } from "../node-event";

export const openRootContextMenu = (
  editor: LexicalEditor,
  event: React.MouseEvent
) => {
  return editor.dispatchCommand(ROOT_CONTEXT_MENU_COMMAND, { event });
};

export const RootContextMenu = () => {
  const { current, openJsonViewModal } = useTemplate();
  const { refresh } = useRefresh();
  const { actions, safeParse } = useEditorServerActions();
  const [editor] = useLexicalComposerContext();
  const { pushRouter } = useNavigation();
  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] =
    useState<RootContextMenuEventHandlerParameters>();
  const {
    getParameters,
    globalEvent: { mousePosition },
  } = useGlobalEvent();
  const nodeEvent = useNodeEvent();

  useEffect(() => {
    return editor.registerCommand(
      ROOT_CONTEXT_MENU_COMMAND,
      (payload) => {
        const { event } = payload;
        logger.log("ROOT_CONTEXT_MENU_COMMAND received");
        setContextMenu({
          event,
          anchorReference: "anchorPosition",
          anchorPosition:
            event.clientX && event.clientY
              ? { top: event.clientY, left: event.clientX }
              : undefined,
          close: () => setOpen(false),
        });
        setOpen(true);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  const handleClose = () => {
    setOpen(false);
  };

  const handlePaste = (e: MouseEvent) => {
    editor.update(
      () => {
        // Append copied node to the root node
        $pasteNodeMenuHandler(getParameters(e, nodeEvent)); //(undefined, editor);
        handleClose();
      },
      {
        discrete: true,
        tag: PASTE_TAG,
      }
    );
  };

  const handleDuplicateTemplate = () => {
    if (!current?.id) {
      return;
    }

    actions.template
      .duplicate(current.id)
      .then(safeParse)
      .then((result) => {
        if (result.success) {
          refresh();
          pushRouter({ id: result.data });
        }
        handleClose();
      });
  };

  const handleOpenJsonView = () => {
    //openSettingsModal("json", current.template);
    openJsonViewModal();
    handleClose();
  };

  return (
    <Menu
      open={open}
      onClose={handleClose}
      anchorReference={contextMenu?.anchorReference}
      // anchorEl={contextMenu?.event.currentTarget}
      // anchorPosition={contextMenu?.anchorPosition}
      anchorPosition={{
        top: mousePosition.current.y,
        left: mousePosition.current.x,
      }}
    >
      <MenuItem
        onClick={handlePaste}
        disabled={$getCopiedNode() ? false : true}
        title="Paste"
      />

      <MenuItem onClick={handleDuplicateTemplate} title="Duplicate template" />
      <MenuItem onClick={handleOpenJsonView} title="JSON editor" />
    </Menu>
  );
};
