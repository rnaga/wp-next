import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CollectionsIcon from "@mui/icons-material/Collections";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { useNodeEvent } from "../../../../client/node-event";
import { CollectionNode } from "../CollectionNode";
import {
  collectionDragDropValidator,
  collectionDropEventHandler,
  collectionEventHandlers,
  collectionPostDropEventHandler,
} from "./collection-event-handlers";
import { CollectionRightPanelForm } from "./CollectionRightPanelForm";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";

export const CollectionEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
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
      klassNode: CollectionNode,
      eventHandlers: collectionEventHandlers,
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: CollectionNode,
      priority: 1,
      type: "data",
      title: "collection",
      icon: CollectionsIcon,
    });
  }, []);

  // Register Drag Drop Validator
  useEffect(() => {
    registerDragDropValidator(collectionDragDropValidator);
  }, []);

  // Register Right Panel Editor Form
  // useEffect(() => {
  //   registerRightPanelForm(CollectionNode, [
  //     StylesForm,
  //     CollectionRightPanelForm,
  //   ]);
  // }, []);

  useEffect(() => {
    registerRightForms(CollectionNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: CollectionRightPanelForm,
      },
      {
        title: "Animations",
        component: AnimationRightPanelForm,
      },
    ]);
  }, []);

  // Register Drop Event Handler
  useEffect(() => {
    registerDropEventHandler(collectionDropEventHandler);
    registerDropPostEventHandler(collectionPostDropEventHandler);
  }, []);

  return null;
};
