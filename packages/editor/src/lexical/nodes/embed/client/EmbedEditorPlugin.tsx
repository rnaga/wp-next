import { useEffect } from "react";

import CodeIcon from "@mui/icons-material/Code";

import { useDraggable } from "../../../../client/draggable";
//import { registerRightPanelForm } from "../../../../client/right-panel-form/RightPanelForm";
//import { StylesForm } from "../../../../client/right-panel-form/styles/Styles";
import { EmbedNode } from "../EmbedNode";
import { EmbedRightPanelForm } from "./EmbedRightPanelForm";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { registerToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { EmbedToolBox } from "./EmbedToolBox";

export const EmbedEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: EmbedNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: EmbedNode,
      priority: 10,
      type: "advanced",
      title: "embed",
      icon: CodeIcon,
    });
  }, []);

  // Register Right Panel Editor Form
  useEffect(() => {
    registerRightForms(EmbedNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: EmbedRightPanelForm,
      },
    ]);
  }, []);

  useEffect(() => {
    registerToolBox(EmbedNode.getType(), {
      component: EmbedToolBox,
    });
  }, []);

  return null;
};
