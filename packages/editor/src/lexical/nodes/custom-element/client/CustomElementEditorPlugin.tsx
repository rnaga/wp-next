import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";

import TuneIcon from "@mui/icons-material/Tune";
import { CustomElementNode } from "../CustomElementNode";
import { CustomElementRightPanelForm } from "./CustomElementRightPanelForm";

export const CustomElementEditorPlugin = () => {
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
      klassNode: CustomElementNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: CustomElementNode,
      priority: 4,
      type: "advanced",
      title: "Custom Element",
      icon: TuneIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(CustomElementNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: CustomElementRightPanelForm,
      },
      {
        title: "Animations", // This adds the Animations tab
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
