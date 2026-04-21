import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { CSS } from "../../styles-core/css";
import {
  $processTemplateText,
  inheritSerializedTemplateTextNode,
  inheritTemplateTextNode,
  SerializedTemplateTextNode,
  TemplateTextNode,
} from "../template-text/TemplateTextNode";

export type SerializedImageNode = Spread<
  {
    __css: Record<string, any>;
    __url: string;
  },
  SerializedTemplateTextNode
>;

export class ImageNode extends TemplateTextNode {
  __url: string = "";

  constructor(__text?: string, key?: string) {
    super(__text ?? "", key);
  }

  static getType(): string {
    return "image";
  }

  getUrl() {
    return this.__url;
  }

  loadText(options?: { data?: Record<string, any> }): void {
    //super.loadTemplate(options);
    let url = this.getSettings().url;

    if (url) {
      const writable = this.getWritable();
      writable.__url = $processTemplateText(url, {
        ...options,
        node: this,
      });
    }
  }

  static clone(node: ImageNode): ImageNode {
    const newNode = new ImageNode(node.__text, node.__key);
    inheritTemplateTextNode(newNode, node);
    newNode.__url = node.__url;
    return newNode;
  }

  protected setMediaDOM(element: HTMLElement) {
    const imgUrl = this.getUrl();
    if (!imgUrl) {
      return;
    }

    (element as HTMLImageElement).src = imgUrl;
    element.setAttribute("alt", imgUrl);
  }

  __heightWhenEmpty: number = 200;

  isEmpty(): boolean {
    return this.getUrl().length === 0;
  }

  getEmptyText(): string {
    return "Image URL is empty";
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");

    this.__css.setDefault({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
      width: "200px",
      height: "200px",
    });

    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("img");
    element.draggable = false;
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });
    this.setMediaDOM(element);
    return element;
  }

  updateDOM(
    prevNode: TemplateTextNode & ImageNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    if (!this.isEmpty() && element.tagName === "DIV") {
      return true;
    }

    this.setMediaDOM(element);
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = new ImageNode();
    inheritSerializedTemplateTextNode(node, serializedNode);

    node.__url = serializedNode.__url;
    return node;
  }

  exportJSON(): SerializedImageNode & SerializedTemplateTextNode {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      __url: this.__url,
    };
  }
}

export const $createImageNode = (node?: ImageNode) => {
  const image = new ImageNode();
  inheritTemplateTextNode(image, node);
  if (node) {
    image.__settings = { ...node.__settings };
  }
  return image;
};

export const $isImageNode = (node: unknown): node is ImageNode & CSS =>
  node instanceof ImageNode;
