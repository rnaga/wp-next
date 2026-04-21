import { useEffect } from "react";

import SearchIcon from "@mui/icons-material/Search";

import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { SearchBoxNode } from "../SearchBoxNode";
import { SearchBoxRightPanelForm } from "./SearchBoxRightPanelForm";

export const SearchBoxEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: SearchBoxNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: SearchBoxNode,
      priority: 3,
      type: "data",
      title: "SearchBox",
      icon: SearchIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(SearchBoxNode.getType(), [
      {
        title: "Style",
        component: StyleForm,
      },
      {
        title: "Settings",
        component: SearchBoxRightPanelForm,
      },
    ]);
  }, []);

  return null;
};
