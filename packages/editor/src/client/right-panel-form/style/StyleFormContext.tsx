import {
  $getNodeByKey,
  COMMAND_PRIORITY_HIGH,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import React, {
  createContext,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { signal, Signal, useSignal } from "@preact/signals-react";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { useBreakpoint } from "../../breakpoint";
import { WP_BREAKPOINT_DEVICE_CHANGED_COMMAND } from "../../breakpoint/commands";
import { useDevice } from "../../breakpoint/use-device";
import { useSelectedNode } from "../../global-event";
import { NODE_PROPERTY_UPDATED } from "../../node-event";
import { RIGHT_PANEL_FORM_UPDATE_COMMAND } from "../commands";
import { useElementState } from "../ElementStateContext";

import type * as types from "../../../types";
import { cssKeyToCamelCase } from "../../../lexical/styles/css-variables";
import { addLexicalCommands } from "../../event-utils";

const Context = createContext<{
  //formData: types.CSSKeyValue;
  formDataRef: RefObject<types.CSSKeyValue>;
  formDataSignal: Signal<types.CSSKeyValue>;
  formKey: string;
}>({} as any);

export const useStyleFormContext = () => {
  return useContext(Context);
};

//const formDataSignal = signal<types.CSSKeyValue>({});

export const StyleFormContext = (props: { children: React.ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { device: selectedDevice } = useDevice();
  const { wpHooks } = useWP();

  const { selectedNode } = useSelectedNode();
  const [formKey, setFormKey] = useState<string>(
    Math.random().toString(36).substring(2, 15)
  );

  const { elementState, updateElementState, elementStateRef } =
    useElementState();

  const formDataSignal = signal<types.CSSKeyValue>({});
  const formDataRef = useRef(formDataSignal.value);

  const syncFormData = useCallback(
    (node?: WPLexicalNode) => {
      if (!selectedNode) return;
      node =
        node ??
        (editor
          .getEditorState()
          .read(() => $getNodeByKey(selectedNode.getKey())) as WPLexicalNode);

      const css = editor.read(
        () => node.getLatest().__css.get() as Record<string, any>
      );

      // Before updating the form data, convert `${string}-${string} to camel case
      const convertedCSS = Object.keys(css).reduce(
        (acc, key) => {
          const cssCamelCase = cssKeyToCamelCase(key);
          acc[cssCamelCase] = css[key];
          return acc;
        },
        {} as Record<string, any>
      );

      formDataSignal.value = structuredClone(convertedCSS);
      formDataRef.current = convertedCSS;

      wpHooks.action.doCommand(RIGHT_PANEL_FORM_UPDATE_COMMAND, {
        nodeKey: node.getKey(),
        formData: convertedCSS,
      });
    },
    [selectedNode, selectedDevice, elementState]
  );

  useEffect(() => {
    syncFormData();
    setFormKey(Math.random().toString(36).substring(2, 15)); // Generate a new key for re-rendering
  }, [selectedNode, selectedDevice, elementState]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        syncFormData(node);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode, selectedDevice, elementState]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_DEVICE_CHANGED_COMMAND,
      () => {
        syncFormData();
      }
    );
  }, [selectedNode, selectedDevice, elementState]);

  return (
    <Context
      value={{
        formDataRef,
        formDataSignal,
        formKey,
      }}
    >
      {props.children}
    </Context>
  );
};
