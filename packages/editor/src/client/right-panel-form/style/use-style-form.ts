import { useCallback, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useStyleFormContext } from "./StyleFormContext";
import { useSelectedNode } from "../../global-event";

import type * as types from "../../../types";
import { useElementState } from "../ElementStateContext";
import { $updateCSS } from "../../../lexical/styles-core/css";
import {
  $createNodeSelection,
  $getSelection,
  $setSelection,
  HISTORY_MERGE_TAG,
} from "lexical";

export const useStyleForm = () => {
  const { formDataRef, formDataSignal, formKey } = useStyleFormContext();

  const { elementState, elementStateRef, updateElementState } =
    useElementState();

  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();

  const prevValue = useRef<Record<string, any>>({});
  const lastStyleUpdateAtRef = useRef<number>(0);

  // Merge history entries for rapid successive form updates.
  const HISTORY_MERGE_WINDOW_MS = 200;

  const getPrevValue = <T extends Record<string, any>>(key: keyof T) => {
    return prevValue.current[key as string] ?? undefined;
  };

  const getFormKey = useCallback(
    (prefix: string) => {
      return `${prefix}-${formKey}-${elementState}`;
    },
    [formKey, elementState]
  );

  const savePrevValue = (
    callback: (css: types.CSSKeyValue) => Record<string, any>
  ) => {
    const css = editor.read(() => selectedNode!.getLatest()).__css.get();
    const valueOrUndefined = callback(css);
    prevValue.current = {
      ...prevValue.current,
      ...valueOrUndefined,
    };
  };

  const updateFormData = useCallback(
    (
      formData: Partial<Record<keyof types.CSSKeyValue, any>>,
      options?: {
        elementState?: types.CSSState;
      }
    ) => {
      const now = Date.now();
      // If style updates happen in quick succession (typing/dragging),
      // merge them into the same undo step instead of creating one history
      // entry per keystroke/move.
      const shouldMerge =
        lastStyleUpdateAtRef.current > 0 &&
        now - lastStyleUpdateAtRef.current < HISTORY_MERGE_WINDOW_MS;
      lastStyleUpdateAtRef.current = now;

      editor.update(
        () => {
          $setSelection(null);
          //const selection = $getNo

          $updateCSS({
            editor,
            node: selectedNode?.getLatest(),
            styles: formData,
            elementState: options?.elementState,
            type: "input",
          });
          const nodeSelection = $createNodeSelection();
          nodeSelection.clear();
          $setSelection(nodeSelection);
        },
        {
          discrete: true,
          // Rapid consecutive style changes are merged into one undo history entry.
          ...(shouldMerge ? { tag: HISTORY_MERGE_TAG } : {}),
        }
      );
    },
    [selectedNode]
  );

  useEffect(() => {
    // If the selected node changes, reset the saved value
    prevValue.current = {};
  }, [selectedNode]);

  return {
    formKey,
    getFormKey,
    formDataRef,
    formDataSignal,
    updateFormData,
    getPrevValue,
    savePrevValue,
  };
};
