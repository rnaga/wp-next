import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

export type SerializedListItemNode = Spread<{}, SerializedWPElementNode>;

export class ListItemNode extends WPElementNode {
  static getType(): string {
    return "list-item";
  }

  static clone(node: ListItemNode): ListItemNode {
    const newNode = new ListItemNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("li");

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
    const element = document.createElement("li");
    return element;
  }

  updateDOM(
    prevNode: ListItemNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(serializedNode: SerializedListItemNode): ListItemNode {
    const node = $createListItemNode();
    node.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedListItemNode {
    return {
      ...super.exportJSON(),
      type: "list-item",
    };
  }
}

export const $createListItemNode = (node?: ListItemNode) => {
  const wrapper = new ListItemNode();
  $afterWPElementNodeCreation(wrapper, node);
  return wrapper;
};

export const $isListItemNode = (node: unknown): node is ListItemNode & CSS =>
  node instanceof ListItemNode;
