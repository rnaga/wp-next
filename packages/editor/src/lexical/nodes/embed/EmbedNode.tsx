import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { CSS } from "../../styles-core/css";
import { replaceInnerHTML, setInnerHTML } from "../../custom-code";
import {
  $afterWPTextNodeCreation,
  SerializedWPTextNode,
  WPTextNode,
} from "../wp/WPTextNode";

export type SerializedEmbedNode = Spread<{}, SerializedWPTextNode>;

export class EmbedNode extends WPTextNode {
  static getType(): string {
    return "embed";
  }

  constructor(__text?: string, key?: string) {
    super(__text ?? "", key);
  }

  static clone(node: EmbedNode): EmbedNode {
    const newNode = new EmbedNode(node.__text, node.__key);
    newNode.afterClone(node);

    return newNode;
  }

  getEmptyText(): string {
    return "Embed code is empty";
  }

  setDOM(element: HTMLElement) {
    const code = this.getCode();
    if (code.length > 0) {
      replaceInnerHTML(element, code);
    }
  }

  isEmpty(): boolean {
    return this.getCode().length === 0;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");

    this.__css.setDefaultIfEmpty({
      padding: "20px",
    });

    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    this.setDOM(element);

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPTextNode,
    element: HTMLElement,
    config: EditorConfig
  ) {
    super.deInitEmptyDOM(prevNode, element, config);
    this.__css.removeFromAllDevices(["padding"]);
  }

  updateDOM(
    prevNode: EmbedNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    this.setDOM(element);
    return false;
  }

  static importJSON(serializedNode: SerializedEmbedNode): EmbedNode {
    const node = new EmbedNode(serializedNode.text);
    node.importJSON(serializedNode);

    return node;
  }

  setCode(code: string) {
    this.setTextContent(encodeURIComponent(code));
  }

  getCode() {
    return decodeURIComponent(this.__text);
  }

  exportJSON(): SerializedEmbedNode {
    return {
      ...super.exportJSON(),
      text: this.__text,
      type: "embed",
    };
  }
}

export const $createEmbedNode = (node?: EmbedNode) => {
  const embed = new EmbedNode(node?.__text);
  $afterWPTextNodeCreation(embed, node);
  return embed;
};

export const $isEmbedNode = (node: unknown): node is EmbedNode & CSS =>
  node instanceof EmbedNode;
