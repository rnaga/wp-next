import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { CSSEditor } from "../../../types";
import { InputType } from "./input";
import { SerializedWPTextNode, WPTextNode } from "../wp";
import { $afterWPTextNodeCreation } from "../wp/WPTextNode";

export type SerializedLabelNode = Spread<
  {
    __text: string;
  },
  SerializedWPTextNode
>;

export class LabelNode extends WPTextNode {
  //__removable: boolean = false;
  //__draggable: boolean = false;

  __text: string = "Label";

  static getType(): string {
    return "form-label";
  }

  static clone(node: LabelNode): LabelNode {
    const newNode = new LabelNode(node.__text, node.__key);
    newNode.afterClone(node);
    newNode.__text = node.__text;
    return newNode;
  }

  isEmpty(): boolean {
    return false;
  }

  getLabel(): string {
    return this.__text;
  }

  setLabel(text: string): void {
    this.__text = text;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("label");
    element.textContent = this.__text;
    return element;
  }

  deInitEmptyDOM(
    prevNode: WPTextNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("label");
    element.textContent = this.__text;
    return element;
  }

  updateDOM(
    prevNode: LabelNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    element.textContent = this.__text;
    return false;
  }

  static importJSON(serializedNode: SerializedLabelNode): LabelNode {
    const node = $createLabelNode();
    node.importJSON(serializedNode);
    node.__text = serializedNode.__text;
    return node;
  }

  exportJSON(): SerializedLabelNode {
    return {
      ...super.exportJSON(),
      __text: this.__text,
      type: "form-label",
    };
  }
}

export const $createLabelNode = (node?: LabelNode) => {
  const label = new LabelNode(node?.__text || "Label");
  $afterWPTextNodeCreation(label, node);
  label.__text = node ? node.__text : "Label";
  return label;
};

export const $isLabelNode = (node: unknown): node is LabelNode & CSS =>
  node instanceof LabelNode;
