import { $getNodeByKey, COMMAND_PRIORITY_HIGH } from "lexical";
import {
  createContext,
  CSSProperties,
  RefObject,
  use,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  $getCSSVariableContentItem,
  $getCSSVariableContentItemArray,
  $getCSSVariableUsage,
  $getCSSVariableUsageArray,
  cssVariableUsageKeyType,
  getCSSVariablesUsageObjectKey,
  removeCSSVariableUsage,
  updateCSSVariableUsage,
} from "../../lexical/nodes/css-variables/CSSVariablesNode";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { useDevice } from "../breakpoint/use-device";
import { useSelectedNode } from "../global-event";
import { NODE_PROPERTY_UPDATED } from "../node-event";
import { useCSSVariables } from "./CSSVariablesContext";

import type * as types from "../../types";
import { useElementState } from "../right-panel-form/ElementStateContext";
import { NODE_CSS_UPDATED_COMMAND } from "../../lexical/commands";

export const Context = createContext<{
  keyofUsage: types.KeyOfCSSVariablesUsageMixed;
  usageType: "single" | "array" | "object";
  //altKeyofUsage?: types.AltKeyOfCSSVariablesUsage[];
  selectedCSSVariables: types.CSSVariables | undefined;
  setSelectedCSSVariables: React.Dispatch<
    React.SetStateAction<types.CSSVariables | undefined>
  >;
  loading: boolean;
  startTransition: React.TransitionStartFunction;
  overrideMode: boolean;
  setOverrideMode: React.Dispatch<React.SetStateAction<boolean>>;
  usage: types.ValueOfCSSVariablesUsage | undefined;
  setUsage: React.Dispatch<
    React.SetStateAction<types.ValueOfCSSVariablesUsage | undefined>
  >;
  usageArray: types.ValueOfCSSVariablesUsage[];
  setUsageArray: React.Dispatch<
    React.SetStateAction<types.ValueOfCSSVariablesUsage[]>
  >;
  usageArrayIndex: RefObject<number | undefined>;
  refreshUsage: (node?: WPLexicalNode) => void;
}>({} as any);

export const CSSVariablesItemContext = (props: {
  keyofUsage: types.KeyOfCSSVariablesUsageMixed;
  usageArrayIndex?: number;
  altKeyofUsage?: types.AltKeyOfCSSVariablesUsage[];
  children: React.ReactNode;
}) => {
  const { children, keyofUsage, altKeyofUsage } = props;

  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [selectedCSSVariables, setSelectedCSSVariables] =
    useState<types.CSSVariables>();

  const { device } = useDevice();
  const { elementState } = useElementState();

  const [loading, startTransition] = useTransition();
  const [overrideMode, setOverrideMode] = useState(false);

  const [usage, setUsage] = useState<types.ValueOfCSSVariablesUsage>();

  const [usageArray, setUsageArray] = useState<
    types.ValueOfCSSVariablesUsage[]
  >([]);

  const usageArrayIndex = useRef<number | undefined>(props.usageArrayIndex);

  useEffect(() => {
    usageArrayIndex.current = props.usageArrayIndex;
  }, [props.usageArrayIndex]);

  // Sync local usage state when CSS is updated externally for object-type keys.
  //
  // Object-type css variable usage keys (e.g., "transform-rotate", "transform-skewX") share the same
  // key in CSS.__styles ("%transform"). Each sub-property is controlled by a separate
  // form in the Right Panel, but changes to one can affect others:
  //
  // - When "%transform: {rotate: '...'}" in CSS.__styles[device] / CSS.__stateStyles[state][device]
  // is removed or updated, the entire "%transform" property may be
  //   recompiled, potentially removing "transform-skewX" from __cssVariablesUsage
  // - This useEffect listens for NODE_CSS_UPDATED_COMMAND and checks if our
  //   specific keyofUsage still exists in __cssVariablesUsage
  // - If it was removed (by another form's update), we clear the local usage state
  //   to keep the UI in sync
  //
  // This ensures that when one transform sub-property form triggers a CSS update,
  // other transform sub-property forms will detect if their usage was removed.
  useEffect(() => {
    if (cssVariableUsageKeyType(keyofUsage) !== "object") {
      return;
    }

    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ styles }) => {
        const objectKey = getCSSVariablesUsageObjectKey(keyofUsage);

        const css = editor.read(() =>
          selectedNode?.getLatest().__css.get()
        ) as Record<string, any>;

        // Clear local usage state if this key was removed from __cssVariablesUsage
        const cssVariablesUsage = css.__cssVariablesUsage || {};
        if (!cssVariablesUsage[keyofUsage]) {
          setUsage(undefined);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  const usageType = cssVariableUsageKeyType(keyofUsage);

  const refreshUsage = (node?: WPLexicalNode) => {
    const target = node || selectedNode;
    if (!target) return;

    if (usageType === "single" || usageType === "object") {
      const result = editor.read(() =>
        $getCSSVariableUsage(
          target.getLatest(),
          keyofUsage as types.KeyOfCSSVariablesUsage
        )
      );
      setUsage(result);
    }

    if (usageType === "array") {
      const result = editor.read(() =>
        $getCSSVariableUsageArray(
          target.getLatest(),
          keyofUsage as types.KeyOfCSSVariablesUsageArray
        )
      );
      setUsageArray(result ?? []);
    }
  };

  useEffect(() => {
    setOverrideMode(false);
    refreshUsage(selectedNode);
  }, [device, elementState]);

  return (
    <Context
      value={{
        keyofUsage,
        usageType,
        //altKeyofUsage,
        selectedCSSVariables,
        setSelectedCSSVariables,
        loading,
        startTransition,
        overrideMode,
        setOverrideMode,
        usage,
        setUsage,
        usageArray,
        setUsageArray,
        usageArrayIndex,
        refreshUsage,
        // setUsageArrayIndex,
      }}
    >
      {children}
    </Context>
  );
};

export const useCSSVariablesItem = () => {
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();
  //const { device } = useDevice()

  // Note: cssVariablesList is used to update the value when the css variable is updated / soft updated
  const { cssVariablesList } = useCSSVariables();

  const context = useContext(Context);
  const {
    keyofUsage,
    //altKeyofUsage,
    selectedCSSVariables,
    setSelectedCSSVariables,
    startTransition,
    setOverrideMode,
    usage,
    usageArray,
    usageType,
    usageArrayIndex,
    refreshUsage,
  } = context;

  const [contentItems, setContentItems] = useState<
    {
      collectionID: number | undefined;
      collectionSlug: string | undefined;
      item: types.CSSVariablesContentItem | undefined;
      index: number;
    }[]
  >([]);

  const deleteUsage = (args?: { usageArrayIndex?: number }) => {
    usageArrayIndex.current = args?.usageArrayIndex ?? usageArrayIndex.current;

    let deleteUsage: types.ValueOfCSSVariablesUsage | undefined =
      usageType === "single" || usageType === "object"
        ? usage
        : usageArray[usageArrayIndex.current!];

    if (!deleteUsage) {
      logger.log("Skipping delete usage", deleteUsage, usageArray);
      return;
    }

    // If usageType is single or object and inherit is true,
    // set overrideMode to true and return so that it can be overridden
    if (
      (usageType === "single" || usageType === "object") &&
      deleteUsage.inherit === true
    ) {
      setOverrideMode(true);
      return;
    }

    startTransition(async () => {
      await removeCSSVariableUsage(editor, selectedNode!, {
        keyofUsage,
        slug: deleteUsage.slug,
        arrayIndex: usageType === "array" ? usageArrayIndex.current : undefined,
      });

      const latestNode = editor
        .getEditorState()
        .read(() =>
          $getNodeByKey(selectedNode!.getLatest().getKey())
        ) as WPLexicalNode;

      refreshUsage(latestNode);

      editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
        node: latestNode,
      });

      // Right Panel Form relies on NODE_CSS_UPDATED_COMMAND to refresh its state
      // so we need to dispatch it here as well
      editor.dispatchCommand(NODE_CSS_UPDATED_COMMAND, {
        node: latestNode,
        styles: latestNode.__css.get(),
        type: "mouse", // use "mouse" so that StyleSize and other style panels can pick up the changes
      });
    });

    setSelectedCSSVariables(undefined);
  };

  const updateUsage = (
    contentItem: types.CSSVariablesContentItem,
    cssVariables: types.CSSVariables,
    options?: {
      usageArrayIndex?: number;
    }
  ) => {
    if (!selectedCSSVariables) {
      return;
    }

    startTransition(async () => {
      if (options?.usageArrayIndex !== undefined) {
        usageArrayIndex.current = options.usageArrayIndex;
      }

      await updateCSSVariableUsage(editor, selectedNode!, {
        keyofUsage,
        //altKeyofUsage,
        slug: cssVariables.slug,
        variableName: contentItem.variableName,
        arrayIndex: usageType === "array" ? usageArrayIndex.current : undefined,
      });

      const latestNode = editor
        .getEditorState()
        .read(() =>
          $getNodeByKey(selectedNode!.getLatest().getKey())
        ) as WPLexicalNode;

      refreshUsage(latestNode);

      editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
        node: latestNode,
      });

      // Right Panel Form relies on NODE_CSS_UPDATED_COMMAND to refresh its state
      // so we need to dispatch it here as well
      editor.dispatchCommand(NODE_CSS_UPDATED_COMMAND, {
        node: latestNode,
        styles: latestNode.__css.get(),
        type: "mouse", // use "mouse" so that StyleSize and other style panels can pick up the changes
      });
    });
  };

  useEffect(() => {
    refreshUsage(selectedNode);
  }, [keyofUsage, selectedNode]);

  useEffect(() => {
    if (
      (!usage && !usageArray) ||
      !selectedNode ||
      cssVariablesList.length === 0
    ) {
      // Unset contentItemAndIndex if usage is not available
      setContentItems([]);
      return;
    }

    if (usageType === "single" || usageType === "object") {
      editor.read(() => {
        const { collectionID, collectionSlug, item, index } =
          $getCSSVariableContentItem(
            selectedNode!.getLatest(),
            keyofUsage as types.KeyOfCSSVariablesUsage
          );

        setContentItems([{ collectionID, collectionSlug, item, index }]);
      });
    }

    if (usageType === "array") {
      editor.read(() => {
        const items = $getCSSVariableContentItemArray(
          selectedNode!.getLatest(),
          keyofUsage as types.KeyOfCSSVariablesUsageArray
        );

        setContentItems(items);
      });
    }
  }, [usage, usageArray, keyofUsage, selectedNode, cssVariablesList]);

  useEffect(() => {
    if (!selectedNode) {
      setOverrideMode(false);
    }
  }, [keyofUsage, selectedNode, usage]);

  if (context === undefined) {
    throw new Error(
      "useCSSVariablesItem must be used within a CSSVariablesItemContext"
    );
  }

  return {
    ...context,
    refreshUsage,
    deleteUsage,
    updateUsage,
    contentItems,
  };
};
