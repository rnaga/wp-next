import { useEffect } from "react";

import VideocamIcon from "@mui/icons-material/Videocam";

import { useDraggable } from "../../../../client/draggable";
import { useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { VideoNode } from "../VideoNode";
import { videoEventHandlers } from "./video-event-handlers";
import { VideoRightPanelForm } from "./VideoRightPanelForm";

export const VideoEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: VideoNode,
      eventHandlers: videoEventHandlers,
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: VideoNode,
      priority: 2,
      type: "media",
      title: "Video",
      icon: VideocamIcon,
    });
  }, []);

  // Register Editor Form
  useEffect(() => {
    registerRightForms(VideoNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: VideoRightPanelForm,
      },
      {
        title: "Animations",
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
