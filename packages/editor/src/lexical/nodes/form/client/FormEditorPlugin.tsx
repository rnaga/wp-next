import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CollectionsIcon from "@mui/icons-material/Collections";

import { useDragDrop } from "../../../../client/drag-drop";
import { useDraggable } from "../../../../client/draggable";
import { eventHandlers, useNodeEvent } from "../../../../client/node-event";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import InputIcon from "@mui/icons-material/Input";
import LabelIcon from "@mui/icons-material/Label";
import DatasetIcon from "@mui/icons-material/Dataset";

import {
  formDragDropValidator,
  formPostDropEventHandler,
} from "./form-event-handlers";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { FormNode, $isFormNode } from "../FormNode";
import { InputNode } from "../InputNode";
import { InputWrapperNode } from "../InputWrapperNode";
import { LabelNode } from "../LabelNode";
import { InputWrapperRightPanelForm } from "./InputWrapperRightPanelForm";
import { FieldSetNode } from "../FieldSetNode";
import { LegendNode } from "../LegendNode";
import { LegendRightPanelForm } from "./LegendRightPanelForm";
import { FormRightPanelForm } from "./FormRightPanelForm";
import { AnimationRightPanelForm } from "../../../../client/right-panel-form/animation";
import { AttributesRightPanelForm } from "../../wp/client/AttributesRightPanelForm";
import { FieldSetRightPanelForm } from "./FieldSetRightPanelForm";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { DEFAULT_FORM_HANDLER } from "../constant";
import { $walkNode } from "../../../walk-node";
import { $isFormHandlerNode } from "../FormHandlerNode";
import { $getRoot } from "lexical";

export const FormEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();
  const { wpHooks } = useWP();

  const {
    registerDragDropValidator,
    registerDropEventHandler,
    registerDropPostEventHandler,
  } = useDragDrop();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: FormNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: InputWrapperNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: InputNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: LabelNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: FieldSetNode,
      eventHandlers: eventHandlers(),
    });

    registerNodeEventHandler({
      klassNode: LegendNode,
      eventHandlers: eventHandlers(),
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: FormNode,
      priority: 1,
      type: "form",
      title: "form",
      icon: DynamicFormIcon,
    });

    registerDraggable({
      klassNode: InputWrapperNode,
      priority: 2,
      type: "form",
      title: "input",
      icon: InputIcon,
    });

    registerDraggable({
      klassNode: LabelNode,
      priority: 3,
      type: "form",
      title: "label",
      icon: LabelIcon,
    });

    registerDraggable({
      klassNode: FieldSetNode,
      priority: 4,
      type: "form",
      title: "fieldset",
      icon: DatasetIcon,
    });
  }, []);

  useEffect(() => {
    registerRightForms(FormNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: FormRightPanelForm },
    ]);

    registerRightForms(InputNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: AttributesRightPanelForm },
      { title: "Animations", component: AnimationRightPanelForm },
    ]);

    registerRightForms(LabelNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: AttributesRightPanelForm },
    ]);

    registerRightForms(InputWrapperNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: InputWrapperRightPanelForm },
    ]);

    registerRightForms(FieldSetNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: FieldSetRightPanelForm },
    ]);

    registerRightForms(LegendNode.getType(), [
      { title: "Style", component: StyleForm },
      { title: "Settings", component: LegendRightPanelForm },
    ]);
  }, []);

  // Register Drag Drop Validator
  useEffect(() => {
    registerDragDropValidator(formDragDropValidator);
  }, []);

  // Register Drop Event Handler
  useEffect(() => {
    registerDropEventHandler(formPostDropEventHandler);
    registerDropPostEventHandler(formPostDropEventHandler);
  }, []);

  // Migrate legacy FormHandlerNodes that were serialized without formHandlerType in their config.
  useEffect(() => {
    editor.update(
      () => {
        $walkNode($getRoot(), (node) => {
          if (!$isFormHandlerNode(node)) {
            return true;
          }
          if (node.__config.formHandlerType) {
            return false;
          }
          const parent = node.getParent() ?? null;
          if (!$isFormNode(parent)) {
            return false;
          }
          const formHandlerType = parent.getFormHandlerType();
          if (formHandlerType) {
            const writable = node.getWritable();
            writable.__config = { ...writable.__config, formHandlerType };
          }
          return false;
        });
      },
      { discrete: true }
    );
  }, []);

  return null;
};
