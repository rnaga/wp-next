import { createCommand, LexicalNode, Klass, EditorState } from "lexical";
import { WPLexicalNode } from "../wp";
import { CSSProperties } from "react";
import { CSSVariablesNode } from "./CSSVariablesNode";
import type * as types from "../../../types";

export const NODE_CSS_VARIABLES_USAGE_REMOVED_COMMAND = createCommand<{
  node: WPLexicalNode;
  keys: types.KeyOfCSSVariablesUsage[];
}>();

export const NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND = createCommand<{
  node: WPLexicalNode;
  keys: types.KeyOfCSSVariablesUsage[];
}>();

export const NODE_CSS_VARIABLES_FETCHED_COMMAND = createCommand<{
  node: CSSVariablesNode;
}>();

export const NODE_CSS_VARIABLES_DATA_UPDATED_COMMAND = createCommand<{
  node: CSSVariablesNode;
}>();
