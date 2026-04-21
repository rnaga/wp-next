import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { CSS } from "../../styles-core/css";

import { HTML_CONTAINER_ELEMENT_TAGS } from "./constants";
import { SerializedWPElementNode, WPElementNode } from "../wp";
import { $afterWPElementNodeCreation } from "../wp/WPElementNode";

export type HTMLContainerElementTag =
  (typeof HTML_CONTAINER_ELEMENT_TAGS)[number];

export type SerializedCustomElementNode = Spread<
  {
    __elementType: HTMLContainerElementTag;
  },
  SerializedWPElementNode
>;

export class CustomElementNode extends WPElementNode {
  __elementType: HTMLContainerElementTag = "div";
  static getType(): string {
    return "custom-element";
  }

  static clone(node: CustomElementNode): CustomElementNode {
    const newNode = new CustomElementNode(node.__key);
    newNode.afterClone(node);
    newNode.__elementType = node.__elementType;
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement(this.__elementType || "div");

    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  // initStyle(
  //   element: HTMLElement,
  //   style: CSS,
  //   config: EditorConfig,
  //   editor?: LexicalEditor
  // ): void {
  //   // Set light blue background color with brightening effect
  //   element.style.setProperty("background-color", "rgba(173, 216, 230, 0.5)");
  // }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__elementType || "div");
    return element;
  }

  updateDOM(
    prevNode: CustomElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    if (this.__elementType !== prevNode.__elementType) {
      return true;
    }

    return false;
  }

  static importJSON(
    serializedNode: SerializedCustomElementNode
  ): CustomElementNode {
    const node = $createCustomElementNode();
    node.importJSON(serializedNode);
    node.__elementType = serializedNode.__elementType;
    return node;
  }

  exportJSON(): SerializedCustomElementNode {
    return {
      ...super.exportJSON(),
      __elementType: this.__elementType,
      type: "custom-element",
    };
  }
}

export const $createCustomElementNode = (node?: CustomElementNode) => {
  const customElement = new CustomElementNode();
  $afterWPElementNodeCreation(customElement, node);
  customElement.__elementType = node?.__elementType ?? "div";
  return customElement;
};

export const $isCustomElementNode = (
  node: unknown
): node is CustomElementNode & CSS => node instanceof CustomElementNode;
