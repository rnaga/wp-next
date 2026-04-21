import { useEffect } from "react";

import WrapTextIcon from "@mui/icons-material/WrapText";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { AttributesRightPanelForm } from "../../wp/client/AttributesRightPanelForm";
import { ListItemNode } from "../ListItemNode";
import { ListNode } from "../ListNode";
import ListIcon from "@mui/icons-material/List";
import ReceiptIcon from "@mui/icons-material/Receipt";
import {
  listDragDropValidator,
  listPostDropEventHandler,
} from "./list-event-handlers";
import { ListRightPanelForm } from "./ListRightPanelForm";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";

export const ListEditorPlugin = () => {
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
      klassNode: ListNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: ListItemNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: ListNode,
      priority: 10,
      type: "general",
      title: "List",
      icon: ListIcon,
    });

    registerDraggable({
      klassNode: ListItemNode,
      priority: 11,
      type: "general",
      title: "List Item",
      icon: ReceiptIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(ListNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: ListRightPanelForm,
      },
      {
        title: "Animations", // This adds the Animations tab
        component: AnimationRightPanelForm,
      },
    ]);

    registerRightForms(ListItemNode.getType(), [
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
    registerDragDropValidator(listDragDropValidator);
  }, []);

  // Register Drop Event Handler
  useEffect(() => {
    //registerDropEventHandler(listPostDropEventHandler);
    registerDropPostEventHandler(listPostDropEventHandler);
  }, []);

  return null;
};
