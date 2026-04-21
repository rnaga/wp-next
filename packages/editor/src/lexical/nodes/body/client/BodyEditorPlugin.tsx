import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { BodyNode } from "../BodyNode";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { bodyDragDropValidator } from "./body-event-handlers";
import { useDragDrop } from "../../../../client/drag-drop";

export const BodyEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDragDropValidator } = useDragDrop();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: BodyNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  useEffect(() => {
    registerRightForms(BodyNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: SettingsRightPanelForm,
      },
      {
        title: "Animations", // This adds the Animations tab
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  // Register Drag Drop Validator
  useEffect(() => {
    registerDragDropValidator(bodyDragDropValidator);
  }, []);

  return null;
};
