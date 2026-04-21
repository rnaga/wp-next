"use client";
import { CSSProperties, useEffect } from "react";

import GridViewIcon from "@mui/icons-material/GridView";

import { useDraggable } from "../../../../client/draggable";
import { useDragDrop } from "../../../../client/drag-drop";
import { GridCellNode } from "../GridCellNode";
import { GridNode } from "../GridNode";
import {
  gridCellDragDropValidator,
  gridCellDropEventHandler,
  gridDragDropValidator,
} from "./grid-cell-event-handlers";
import { GridToolBox } from "./GridToolBox";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import {
  createStyleForm,
  StyleForm,
} from "../../../../client/right-panel-form/StyleForm";
import { StyleFormGridCell } from "./right-panel-form/StyleFormGridCell";
import { registerToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { GridCellToolBox } from "./GridCellToolBox";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { GridCellHandlers } from "./GridCellHandlers";
import { GridHandler } from "./GridHandler";

export const GridEditorPlugin = () => {
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();
  const { registerDragDropValidator, registerDropEventHandler } = useDragDrop();
  const { wpHooks } = useWP();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: GridNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: GridCellNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: GridNode,
      priority: 3,
      type: "general",
      title: "Grid",
      icon: GridViewIcon,
    });
  }, []);

  // Register Drag Drop Validator
  useEffect(() => {
    registerDragDropValidator(gridCellDragDropValidator);
    registerDragDropValidator(gridDragDropValidator, [GridNode]);
  }, []);

  // Register Drop Event Handler
  useEffect(() => {
    registerDropEventHandler(gridCellDropEventHandler);
  }, []);

  // Register Right Panel Editor Form
  useEffect(() => {
    registerRightForms(GridNode.getType(), [
      {
        title: "Style",
        component: createStyleForm({
          exclude: ["layout"],
        }),
      },
    ]);
  }, []);

  useEffect(() => {
    registerRightForms(GridCellNode.getType(), [
      { title: "Style", component: StyleFormGridCell },
    ]);
  }, []);

  useEffect(() => {
    registerToolBox("grid", {
      component: GridToolBox,
    });
  }, []);

  useEffect(() => {
    registerToolBox("grid-cell", {
      component: GridCellToolBox,
    });
  }, []);

  return (
    <>
      <GridCellHandlers />
      {/* <GridHandler /> */}
    </>
  );
};
