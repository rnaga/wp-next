import { NodeKey } from "lexical";
import { isEditorMode } from "../editor-mode";
import type * as types from "../../types";
import { WPLexicalNode } from "../nodes/wp";

export class CSSEditorElementState {
  static #current: types.CSSState = "none";
  static #selectedNodeKey: NodeKey | undefined = undefined;

  static getCurrent(nodeKey: NodeKey): types.CSSState {
    return !isEditorMode() ||
      CSSEditorElementState.#selectedNodeKey === null ||
      CSSEditorElementState.#selectedNodeKey !== nodeKey
      ? "none"
      : CSSEditorElementState.#current;
  }

  static setSelectedNode(nodeOrNodeKey: WPLexicalNode | undefined | string) {
    CSSEditorElementState.#selectedNodeKey =
      typeof nodeOrNodeKey === "string"
        ? nodeOrNodeKey
        : nodeOrNodeKey?.getKey();
  }

  static setCurrent(value: types.CSSState) {
    CSSEditorElementState.#current = value;
  }
}
