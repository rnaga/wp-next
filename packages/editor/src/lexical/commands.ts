import { createCommand, LexicalNode, Klass, EditorState } from "lexical";
import { WPLexicalNode } from "./nodes/wp";
import type { CSSProperties } from "react";
import type * as types from "../types";

export const DEFAULT_NODE_CREATED_COMMAND = createCommand<{
  klass: Klass<LexicalNode>;
  node: LexicalNode;
}>();

export const EDITOR_JSON_PARSED_COMMAND = createCommand<{
  editorState: EditorState;
}>();

export const EDITOR_MODE_CONFIG_UPDATED_COMMAND = createCommand<{
  resource: "css" | "dynamicAttributes";
  mappedConfig: types.EditorModeConfigMap;
}>();

export const NODE_CSS_UPDATED_COMMAND = createCommand<{
  node: WPLexicalNode;
  styles: Record<string, any>;
  type?: "mouse" | "input" | "keyboard";
}>();

export const NODE_EDITOR_CSS_UPDATED_COMMAND = createCommand<{
  cssProperties: Record<string, CSSProperties>;
}>();

export const NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND = createCommand<{
  cssProperties: Record<string, CSSProperties>;
  cssString: string;
}>();
