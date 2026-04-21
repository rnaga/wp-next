import { useEffect } from "react";

import ImageIcon from "@mui/icons-material/Image";

import { useDraggable } from "../../../../client/draggable";
import { useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { ImageNode } from "../ImageNode";
import { imageEventHandlers } from "./image-event-handlers";
import { ImageRightPanelForm } from "./ImageRightPanelForm";

export const ImageEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: ImageNode,
      eventHandlers: imageEventHandlers,
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: ImageNode,
      priority: 1,
      type: "media",
      title: "Image",
      icon: ImageIcon,
    });
  }, []);

  // Register Editor Form
  useEffect(() => {
    registerRightForms(ImageNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: ImageRightPanelForm,
      },
      {
        title: "Animations",
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
