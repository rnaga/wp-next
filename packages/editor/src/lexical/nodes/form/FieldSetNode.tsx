import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { $isLegendNode } from "./LegendNode";

export type SerializedFieldSetNode = Spread<{}, SerializedWPElementNode>;

export class FieldSetNode extends WPElementNode {
  static getType(): string {
    return "fieldset";
  }

  static clone(node: FieldSetNode): FieldSetNode {
    const newNode = new FieldSetNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("fieldset");

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
    const element = document.createElement("fieldset");

    return element;
  }

  updateDOM(
    prevNode: FieldSetNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    return false;
  }

  static importJSON(serializedNode: SerializedFieldSetNode): FieldSetNode {
    const node = $createFieldSetNode();
    node.importJSON(serializedNode);
    return node;
  }

  exportJSON(): SerializedFieldSetNode {
    return {
      ...super.exportJSON(),
      type: "fieldset",
    };
  }
}

export const $createFieldSetNode = (node?: FieldSetNode) => {
  const fieldSet = new FieldSetNode();
  $afterWPElementNodeCreation(fieldSet, node);
  return fieldSet;
};

export const $isFieldSetNode = (node: unknown): node is FieldSetNode & CSS =>
  node instanceof FieldSetNode;

export const $getLegendText = (node: FieldSetNode): string | null => {
  const legendNode = node.getChildren().find($isLegendNode);
  if (!legendNode) {
    return null;
  }
  return legendNode.getTextContent();
};
