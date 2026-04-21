import { CSS } from "../../styles-core/css";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { SerializedWPTextNode, WPTextNode } from "../wp";
import { $afterWPTextNodeCreation } from "../wp/WPTextNode";

export type SerializedLegendNode = Spread<
  {
    __text: string;
  },
  SerializedWPTextNode
>;

export class LegendNode extends WPTextNode {
  __text: string = "";
  __removable: boolean = false;

  static getType(): string {
    return "legend";
  }

  isEmpty(): boolean {
    return this.__text.length === 0;
  }

  static clone(node: LegendNode): LegendNode {
    const newNode = new LegendNode(node.__text, node.__key);
    newNode.afterClone(node);
    newNode.__text = node.__text;
    return newNode;
  }

  getLegendText(): string {
    return this.__text;
  }

  setLegendText(text: string): void {
    this.__text = text;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("legend");

    if (this.__text) {
      element.textContent = this.__text;
    }

    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPTextNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("legend");

    if (this.__text) {
      element.textContent = this.__text;
    }

    return element;
  }

  updateDOM(
    prevNode: LegendNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    return false;
  }

  static importJSON(serializedNode: SerializedLegendNode): LegendNode {
    const node = $createLegendNode();
    node.importJSON(serializedNode);
    node.__text = serializedNode.__text;
    return node;
  }

  exportJSON(): SerializedLegendNode {
    return {
      ...super.exportJSON(),
      __text: this.__text,
      type: "legend",
    };
  }
}

export const $createLegendNode = (node?: LegendNode) => {
  const legend = new LegendNode(node ? node.__text : "");
  $afterWPTextNodeCreation(legend, node);
  legend.__text = node ? node.__text : "";
  return legend;
};

export const $isLegendNode = (node: unknown): node is LegendNode & CSS =>
  node instanceof LegendNode;
