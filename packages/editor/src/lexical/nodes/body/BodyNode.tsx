import { $getRoot, ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type * as types from "../../../types";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

export type SerializedBodyNode = Spread<{}, SerializedWPElementNode>;

export class BodyNode extends WPElementNode {
  __removable: boolean = false;
  __draggable: boolean = false;
  //__editableMouseTool: boolean = false;
  __editableContextMenu: boolean = false;
  // Not to show in tree view in left panel
  //__hidden: boolean = true;

  __editorNonEmptyCSS: types.CSSEditor = {
    width: "100%",
    height: "100%",
  };

  static getType(): string {
    return "body";
  }

  static clone(node: BodyNode): BodyNode {
    const newNode = new BodyNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("div");

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    // This div holds HTML attributes for the <body> tag.
    // These attributes are not applied directly here — instead they are forwarded
    // to the real <body> element at render time:
    //   - Server: WPBodyWithAttributes
    //   - Client preview: applyBodyNodeToDocument
    const element = document.createElement("div");
    element.setAttribute("data-lexical-body", "true");
    return element;
  }

  updateDOM(
    prevNode: BodyNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(serializedNode: SerializedBodyNode): BodyNode {
    const node = $createBodyNode();
    node.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedBodyNode {
    return {
      ...super.exportJSON(),
      type: "body",
    };
  }

  isEmpty(): boolean {
    return false;
  }
}

export const $getBodyNode = (): BodyNode => {
  const bodyNode = $getRoot().getChildren().find($isBodyNode);
  if (!bodyNode) {
    throw new Error("BodyNode not found in the editor");
  }
  return bodyNode;
};

export const $createBodyNode = (node?: BodyNode) => {
  const body = new BodyNode();
  $afterWPElementNodeCreation(body, node);
  return body;
};

export const $isBodyNode = (node: unknown): node is BodyNode & CSS =>
  node instanceof BodyNode;
