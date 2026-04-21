import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { isFullScreenPreviewMode } from "../../editor-mode";
import { CSS } from "../../styles-core/css";
import {
  $processTemplateText,
  inheritSerializedTemplateTextNode,
  inheritTemplateTextNode,
  SerializedTemplateTextNode,
  TemplateTextNode,
} from "../template-text/TemplateTextNode";

export type SerializedVideoNode = Spread<
  {
    __css: Record<string, any>;
    __url: string;
  },
  SerializedTemplateTextNode
>;

export class VideoNode extends TemplateTextNode {
  __url: string = "";

  constructor(__text?: string, key?: string) {
    super(__text ?? "", key);
  }

  static getType(): string {
    return "video";
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

  static clone(node: VideoNode): VideoNode {
    const newNode = new VideoNode(node.__text, node.__key);
    inheritTemplateTextNode(newNode, node);
    newNode.__url = node.__url;
    return newNode;
  }

  protected setMediaDOM(element: HTMLElement) {
    const videoUrl = this.getUrl();
    if (!videoUrl) {
      return;
    }

    (element as HTMLVideoElement).src = videoUrl;
  }

  __heightWhenEmpty: number = 200;

  isEmpty(): boolean {
    return this.getUrl().length === 0;
  }

  getEmptyText(): string {
    return "Video URL is empty";
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
    const element = document.createElement("video");
    //element.controls = true;
    //element.draggable = false;
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });
    this.setMediaDOM(element);
    return element;
  }

  attachAttributesInDOM(element: HTMLElement, config: EditorConfig): void {
    super.attachAttributesInDOM(element, config);
    // Suppress autoplay in the editor and inline preview — allow it only in
    // the fullscreen preview (and production, which doesn't use this path).
    if (!isFullScreenPreviewMode) {
      element.removeAttribute("autoplay");
    }
  }

  updateDOM(
    prevNode: TemplateTextNode & VideoNode,
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

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const node = new VideoNode();
    inheritSerializedTemplateTextNode(node, serializedNode);

    node.__url = serializedNode.__url;
    return node;
  }

  exportJSON(): SerializedVideoNode & SerializedTemplateTextNode {
    return {
      ...super.exportJSON(),
      type: "video",
      version: 1,
      __url: this.__url,
    };
  }
}

export const $createVideoNode = (node?: VideoNode) => {
  const image = new VideoNode();
  inheritTemplateTextNode(image, node);
  if (node) {
    image.__settings = { ...node.__settings };
  }
  return image;
};

export const $isVideoNode = (node: unknown): node is VideoNode & CSS =>
  node instanceof VideoNode;
