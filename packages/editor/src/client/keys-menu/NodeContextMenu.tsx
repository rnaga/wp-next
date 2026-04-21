import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useContextMenuContext } from "./ContextMenuContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContextMenuEventHandlerParameters } from "./types";
import { CONTEXT_MENU_COMMAND } from "./commands";
import { COMMAND_PRIORITY_HIGH, LexicalEditor, LexicalNode } from "lexical";
import {
  $copyNodeMenuHandler,
  $cutNodeMenuHandler,
  $deleteNodeMenuHandler,
  $getCopiedNode,
  $pasteNodeMenuHandler,
} from "./node-menu-handlers";
import { ClickAwayListener, Menu, MenuList } from "@mui/material";
import { MenuItem } from "./MenuItem";
import { useGlobalEvent } from "../global-event/use-global-event";
import { useNodeEvent } from "../node-event";
import { WPLexicalNode } from "../../lexical/nodes/wp";

export const openNodeContextMenu = (
  editor: LexicalEditor,
  node: LexicalNode,
  event: React.MouseEvent
) => {
  // Skip if the node is not editable via context menu
  if (!(node as WPLexicalNode).__editableContextMenu) {
    return;
  }

  return editor.dispatchCommand(CONTEXT_MENU_COMMAND, { node, event });
};

export const NodeContextMenu = () => {
  const { contextMenuEventHanlderMap } = useContextMenuContext();
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] =
    useState<ContextMenuEventHandlerParameters>();
  const {
    getParameters,
    globalEvent: { setSelectedNode },
  } = useGlobalEvent();
  const nodeEvent = useNodeEvent();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return editor.registerCommand(
      CONTEXT_MENU_COMMAND,
      (payload) => {
        const { node, event } = payload;
        setContextMenu({
          node,
          event,
          anchorReference: "anchorPosition",
          anchorPosition:
            event.clientX && event.clientY
              ? { top: event.clientY, left: event.clientX }
              : undefined,
          close: () => setOpen(false),
        });
        setOpen(true);

        // Set the selected node to the node that is right-clicked.
        setSelectedNode(node as WPLexicalNode, { focus: true });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  const handler = useMemo(() => {
    return !contextMenu
      ? null
      : contextMenuEventHanlderMap.get(contextMenu?.node.getType());
  }, [contextMenu, contextMenuEventHanlderMap]);

  if (handler && contextMenu) {
    return handler(contextMenu);
  }

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = (e: MouseEvent) => {
    editor.update(
      () => {
        $deleteNodeMenuHandler(getParameters(e, nodeEvent)); //contextMenu?.node, editor);
        handleClose();
      },
      {
        discrete: true,
      }
    );
  };

  const handleCopy = (e: MouseEvent) => {
    editor.update(
      () => {
        $copyNodeMenuHandler(getParameters(e, nodeEvent)); //(contextMenu?.node, editor);
        handleClose();
      },
      {
        discrete: true,
      }
    );
  };

  const handlePaste = (e: MouseEvent) => {
    const node = contextMenu?.node;
    editor.update(
      () => {
        $pasteNodeMenuHandler(getParameters(e, nodeEvent)); //(node, editor);
        handleClose();
      },
      {
        discrete: true,
      }
    );
  };

  const handleCut = (e: MouseEvent) => {
    editor.update(
      () => {
        $cutNodeMenuHandler(getParameters(e, nodeEvent)); //(contextMenu?.node, editor);
        handleClose();
      },
      {
        discrete: true,
      }
    );
  };

  return (
    <Menu
      open={open}
      onClose={handleClose}
      anchorReference={contextMenu?.anchorReference}
      anchorEl={contextMenu?.event.currentTarget}
      anchorPosition={contextMenu?.anchorPosition}
      // anchorPosition={{
      //   top: mousePosition.current.y,
      //   left: mousePosition.current.x,
      // }}

      ref={ref}
    >
      <MenuItem onClick={handleCut} title={`Cut`} />
      <MenuItem onClick={handleCopy} title="Copy" />
      <MenuItem
        onClick={handlePaste}
        title="Paste"
        disabled={$getCopiedNode() ? false : true}
      />
      <MenuItem onClick={handleDelete} title="Delete" />
    </Menu>
  );
};
