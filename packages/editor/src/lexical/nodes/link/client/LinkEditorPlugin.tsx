import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { AttributesRightPanelForm } from "../../wp/client/AttributesRightPanelForm";
import LinkIcon from "@mui/icons-material/Link";
import ListIcon from "@mui/icons-material/List";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { linkPostDropEventHandler } from "./link-event-handlers";
import { LinkRightPanelForm } from "./LinkRightPanelForm";
import { LinkNode } from "../LinkNode";

export const LinkEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();
  const {
    registerDragDropValidator,
    registerDropEventHandler,
    registerDropPostEventHandler,
  } = useDragDrop();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: LinkNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: LinkNode,
      priority: 5,
      type: "general",
      title: "Link",
      icon: LinkIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(LinkNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: LinkRightPanelForm,
      },
      {
        title: "Animations", // This adds the Animations tab
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  // Register Drop Event Handler
  useEffect(() => {
    //registerDropEventHandler(listPostDropEventHandler);
    registerDropPostEventHandler(linkPostDropEventHandler);
  }, []);

  return null;
};
