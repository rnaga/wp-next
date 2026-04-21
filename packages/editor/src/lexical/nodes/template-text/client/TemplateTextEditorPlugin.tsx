import { useEffect } from "react";

import TextFieldsIcon from "@mui/icons-material/TextFields";

import { useDraggable } from "../../../../client/draggable";
import { registerToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { TemplateTextNode } from "../TemplateTextNode";
import { TemplateRightPanelForm } from "./TemplateRightPanelForm";
import { TemplateTextToolBox } from "./TemplateTextToolBox";

export const TemplateTextEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: TemplateTextNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: TemplateTextNode,
      priority: 2,
      type: "general",
      title: "text",
      icon: TextFieldsIcon,
    });
  }, []);

  useEffect(() => {
    registerToolBox(TemplateTextNode.getType(), {
      component: TemplateTextToolBox,
    });
  }, []);

  useEffect(() => {
    registerRightForms(TemplateTextNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: TemplateRightPanelForm,
      },
      {
        title: "Animations",
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
