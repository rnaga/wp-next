import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { WrapperNode } from "../WrapperNode";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { Box } from "@mui/material";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";

export const WrapperEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: WrapperNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: WrapperNode,
      priority: 1,
      type: "general",
      title: "wrapper",
      icon: WrapTextIcon,
    });
  }, []);

  // Register Editor Form
  // useEffect(() => {
  //   registerRightPanelForm(WrapperNode, [StylesForm]);
  // }, []);

  useEffect(() => {
    registerRightForms(WrapperNode.getType(), [
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

  // useEffect(() => {
  //   registerToolBox("wrapper", {
  //     menus: [["Wrapper Settings", "wrapper-settings"]],
  //     component: ToolBoxContainer,
  //   });
  // }, []);

  return null;
};
