import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { AttributesRightPanelForm } from "../../wp/client/AttributesRightPanelForm";
import { HeadingRightPanelForm } from "./HeadingRightPanelForm";
import { HeadingNode } from "../HeadingNode";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import { registerToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { HeadingToolBox } from "./HeadingToolBox";

export const HeadingEditorPlugin = () => {
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
      klassNode: HeadingNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: HeadingNode,
      priority: 4,
      type: "general",
      title: "Heading",
      icon: HeadphonesIcon,
    });
  }, []);

  useEffect(() => {
    registerToolBox(HeadingNode.getType(), {
      component: HeadingToolBox,
    });
  }, []);

  useEffect(() => {
    registerRightForms(HeadingNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: HeadingRightPanelForm,
      },
      {
        title: "Animations", // This adds the Animations tab
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
