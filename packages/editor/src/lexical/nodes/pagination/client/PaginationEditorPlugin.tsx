import { useEffect } from "react";

import PinIcon from "@mui/icons-material/Pin";

import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { PaginationNode } from "../PaginationNode";
import { PaginationRightPanelForm } from "./PaginationRightPanelForm";

export const PaginationEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: PaginationNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: PaginationNode,
      priority: 2,
      type: "data",
      title: "pagination",
      icon: PinIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(PaginationNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: PaginationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
