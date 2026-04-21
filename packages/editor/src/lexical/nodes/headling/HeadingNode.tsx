import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { CSS } from "../../styles-core/css";
import {
  $processTemplateText,
  inheritSerializedTemplateTextNode,
  inheritTemplateTextNode,
  SerializedTemplateTextNode,
  TemplateTextNode,
} from "../template-text/TemplateTextNode";

export type SerializedHeadingNode = Spread<
  {
    __level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  },
  SerializedTemplateTextNode
>;

export class HeadingNode extends TemplateTextNode {
  __level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h1";

  constructor(__text?: string, key?: string) {
    super(__text ?? "", key);
  }

  static getType(): string {
    return "heading";
  }

  static clone(node: HeadingNode): HeadingNode {
    const newNode = new HeadingNode(node.__text, node.__key);
    inheritTemplateTextNode(newNode, node);
    newNode.__level = node.__level;
    return newNode;
  }

  __heightWhenEmpty: number = 200;

  isEmpty(): boolean {
    return this.__text.trim().length === 0;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__level);

    this.__css.setDefault({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__level);
    element.innerHTML = `${this.__text}`;
    return element;
  }

  updateDOM(
    prevNode: TemplateTextNode & HeadingNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    element.innerHTML = this.__text;

    if (this.__level !== prevNode.__level) {
      return true;
    }

    return false;
  }

  static importJSON(serializedNode: SerializedHeadingNode): HeadingNode {
    const node = new HeadingNode();
    inheritSerializedTemplateTextNode(node, serializedNode);

    node.__level = serializedNode.__level;
    return node;
  }

  exportJSON(): SerializedHeadingNode & SerializedTemplateTextNode {
    return {
      ...super.exportJSON(),
      type: "heading",
      version: 1,
      __level: this.__level,
    };
  }
}

export const $createHeadingNode = (node?: HeadingNode) => {
  const heading = new HeadingNode();
  inheritTemplateTextNode(heading, node);
  heading.__level = node?.__level ?? "h1";
  return heading;
};

export const $isHeadingNode = (node: unknown): node is HeadingNode & CSS =>
  node instanceof HeadingNode;
