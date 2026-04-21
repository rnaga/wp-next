import { HISTORY_MERGE_TAG } from "lexical";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import {
  $updateCSSVariablesListData,
  fetchCSSVariablesNode,
} from "../../lexical/nodes/css-variables/CSSVariablesNode";
import {
  deleteVariableFromCSSVariablesContent,
  updateCSSVariablesContent,
} from "../../lexical/styles/css-variables";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { WP_CSS_VARIABLES_DELETED_COMMAND } from "./commands";

import type * as types from "../../types";
const Context = createContext<{
  updateCSSVariablesList: (
    ID: number,
    content: types.CSSVariablesContent
  ) => void;
  cssVariablesListRef: React.RefObject<types.CSSVariablesList>;
  cssVariablesList: types.CSSVariablesList;
  fetchCSSVariablesList: () => Promise<types.CSSVariablesList>;
}>({} as any);

export const useCSSVariablesContext = () => {
  return useContext(Context);
};

export const useCSSVariables = () => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const context = useCSSVariablesContext();
  const {
    updateCSSVariablesList,
    cssVariablesListRef,
    cssVariablesList,
    fetchCSSVariablesList,
  } = context;
  const { actions, safeParse } = useEditorServerActions();

  const defer = async () => {
    // Fetch Data in CSSVariablesNode
    await fetchCSSVariablesNode(editor);

    // Fetch CSS Variables List
    // to update the CSS Variables List in the context
    return await fetchCSSVariablesList();
  };

  const softUpdateItem = (
    cssVariables: types.CSSVariables,
    variableIndex: number | undefined,
    contentItem: types.CSSVariablesContentItem
  ): [false] | [true, types.CSSVariablesContent] => {
    const content = cssVariables.content;
    try {
      const newContent = updateCSSVariablesContent(
        variableIndex ?? -1, // -1 means append the item
        contentItem,
        content
      );

      // Update the CSS Variables List in the context
      updateCSSVariablesList(cssVariables.ID, newContent);

      // Update the CSS Variables List in CSSVariablesNode
      // skip if the variableIndex is undefined because it means we are appending a new item
      if (variableIndex !== 1) {
        editor.update(
          () => {
            $updateCSSVariablesListData(editor, cssVariables, contentItem, {
              variableIndex,
            });
          },
          {
            discrete: true,
            tag: HISTORY_MERGE_TAG,
          }
        );
      }

      return [true, newContent];
    } catch (e) {
      logger.error("Error updating CSS variable content", e);
      return [false];
    }
  };

  const updateItem = async (
    cssVariables: types.CSSVariables,
    variableIndex: number | undefined,
    contentItem: types.CSSVariablesContentItem
  ): Promise<[false] | [true, types.CSSVariablesContent]> => {
    const [success, newContenxt] = softUpdateItem(
      cssVariables,
      variableIndex,
      contentItem
    );

    if (!success) {
      return [false];
    }

    const ID = cssVariables.ID;
    const name = cssVariables.name;

    const result = await actions.cssVariables
      .update(ID, name, newContenxt)
      .then(safeParse);

    if (!result.success) {
      logger.error("Error updating CSS variable", result.error);
      return [false];
    }

    await defer();

    return [true, newContenxt];
  };

  const softDelItem = (
    cssVariables: types.CSSVariables,
    variableIndex: number | undefined
  ): [false] | [true, types.CSSVariablesContent] => {
    const content = cssVariables.content;
    try {
      const newContent = deleteVariableFromCSSVariablesContent(
        variableIndex ?? -1,
        content
      );

      // Update the CSS Variables List in the context
      updateCSSVariablesList(cssVariables.ID, newContent);

      // Trigger CSS Variables deleted command
      wpHooks.action.doCommand(WP_CSS_VARIABLES_DELETED_COMMAND, {
        cssVariables,
      });

      return [true, newContent];
    } catch (e) {
      logger.error("Error deleting CSS variable content", e);
      return [false];
    }
  };

  const delItem = async (
    cssVariables: types.CSSVariables,
    variableIndex: number | undefined
  ): Promise<[false] | [true, types.CSSVariablesContent]> => {
    const [success, newContent] = softDelItem(
      cssVariables,
      variableIndex ?? -1
    );

    if (!success) {
      return [false];
    }

    const ID = cssVariables.ID;
    const name = cssVariables.name;

    const result = await actions.cssVariables
      .update(ID, name, newContent)
      .then(safeParse);

    if (!result.success) {
      logger.error("Error deleting CSS variable", result.error);
      return [false];
    }

    await defer();

    return [true, newContent];
  };

  const del = async (cssVariables: types.CSSVariables) => {
    await actions.cssVariables.del(cssVariables.ID);

    return await defer();
  };

  // Call fetchCSSVariablesNode to update the CSS Variables Node
  const undoSoftUpdate = async () => {
    return await defer();
  };

  return {
    ...context,
    cssVariablesList,
    softUpdateItem,
    updateItem,
    softDelItem,
    delItem,
    del,
    undoSoftUpdate,
  };
};

export const CSSVariablesContext = (props: { children: React.ReactNode }) => {
  const { actions, parse } = useEditorServerActions();
  const cssVariablesListRef = useRef<types.CSSVariablesList>([]);
  const [cssVariablesList, setCSSVariablesList] =
    useState<types.CSSVariablesList>([]);

  const fetchCSSVariablesList = async () => {
    const [list] = await actions.cssVariables
      .list({
        per_page: 100,
      })
      .then(parse);
    cssVariablesListRef.current = list;
    setCSSVariablesList(list);

    return list;
  };

  const updateCSSVariablesList = (
    ID: number,
    content: types.CSSVariablesContent
  ) => {
    const newList = cssVariablesListRef.current.map((cssVariables) =>
      cssVariables.ID !== ID
        ? cssVariables
        : {
            ...cssVariables,
            content,
          }
    );

    cssVariablesListRef.current = newList;
    setCSSVariablesList(newList);
  };

  useEffect(() => {
    fetchCSSVariablesList();
  }, []);

  return (
    <Context
      value={{
        cssVariablesListRef,
        cssVariablesList,
        updateCSSVariablesList,
        fetchCSSVariablesList,
      }}
    >
      {props.children}
    </Context>
  );
};
