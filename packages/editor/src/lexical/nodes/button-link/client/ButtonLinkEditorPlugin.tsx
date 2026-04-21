import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { ButtonLinkRightPanelForm } from "./ButtonLinkRightPanelForm";
import { ButtonLinkNode } from "../ButtonLinkNode";
import RectangleIcon from "@mui/icons-material/Rectangle";

export const ButtonLinkEditorPlugin = () => {
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
      klassNode: ButtonLinkNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: ButtonLinkNode,
      priority: 6,
      type: "general",
      title: "Button Link",
      icon: RectangleIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(ButtonLinkNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: ButtonLinkRightPanelForm,
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
    //registerDropPostEventHandler(linkPostDropEventHandler);
  }, []);

  return null;
};
