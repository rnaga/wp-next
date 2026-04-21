import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";
import { logger } from "../../logger";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

export type SerializedWrapperNode = Spread<{}, SerializedWPElementNode>;

export class WrapperNode extends WPElementNode {
  static getType(): string {
    return "wrapper";
  }

  static clone(node: WrapperNode): WrapperNode {
    const newNode = new WrapperNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("div");

    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(
    prevNode: WrapperNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(serializedNode: SerializedWrapperNode): WrapperNode {
    const node = $createWrapperNode();
    node.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedWrapperNode {
    return {
      ...super.exportJSON(),
      type: "wrapper",
    };
  }
}

export const $createWrapperNode = (node?: WrapperNode) => {
  const wrapper = new WrapperNode();
  $afterWPElementNodeCreation(wrapper, node);
  return wrapper;
};

export const $isWrapperNode = (node: unknown): node is WrapperNode & CSS =>
  node instanceof WrapperNode;
