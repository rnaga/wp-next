import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

export type SerializedListNode = Spread<
  {
    __listType: "ul" | "ol";
    __withBullets: boolean;
  },
  SerializedWPElementNode
>;

export class ListNode extends WPElementNode {
  __withBullets: boolean = true;
  __listType: "ul" | "ol" = "ul";

  static getType(): string {
    return "list";
  }

  static clone(node: ListNode): ListNode {
    const newNode = new ListNode(node.__key);
    newNode.afterClone(node);
    newNode.__listType = node.__listType;
    newNode.__withBullets = node.__withBullets;
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement(this.__listType);

    return element;
  }

  isEmpty(): boolean {
    return this.getChildrenSize() === 0;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__listType);
    this.setBulletType(element);
    return element;
  }

  setBulletType(element: HTMLElement): void {
    if (this.__withBullets === true) {
      element.style.removeProperty("list-style-type");
    } else if (this.__withBullets === false) {
      element.style.setProperty("list-style-type", "none");
    }
  }

  updateDOM(
    prevNode: ListNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    if (this.__listType !== prevNode.__listType) {
      return true;
    }

    this.setBulletType(element);

    return false;
  }

  static importJSON(serializedNode: SerializedListNode): ListNode {
    const node = $createListNode();
    node.importJSON(serializedNode);
    node.__listType = serializedNode.__listType;
    node.__withBullets = serializedNode.__withBullets;
    return node;
  }

  exportJSON(): SerializedListNode {
    return {
      ...super.exportJSON(),
      __listType: this.__listType,
      __withBullets: this.__withBullets,
      type: "list",
    };
  }
}

export const $createListNode = (node?: ListNode) => {
  const list = new ListNode();
  $afterWPElementNodeCreation(list, node);
  list.__listType = node?.__listType ?? "ul";
  list.__withBullets = node?.__withBullets ?? true;
  return list;
};

export const $isListNode = (node: unknown): node is ListNode & CSS =>
  node instanceof ListNode;
