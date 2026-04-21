import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

import {
  $processTemplateText,
  inheritSerializedTemplateTextNode,
  inheritTemplateTextNode,
  SerializedTemplateTextNode,
  TemplateTextNode,
} from "../template-text/TemplateTextNode";

export type SerializedButtonLinkNode = Spread<
  {
    __href: string;
    __label: string;
    __target: "_blank" | "_self" | "_parent" | "_top";
  },
  SerializedTemplateTextNode
>;

export class ButtonLinkNode extends TemplateTextNode {
  __href: string = "#";
  __label: string = "Button";
  __target: "_blank" | "_self" | "_parent" | "_top" = "_self";

  __processedHref: string = "#";
  __processedLabel: string = "Button";

  static getType(): string {
    return "button-link";
  }

  static clone(node: ButtonLinkNode): ButtonLinkNode {
    const newNode = new ButtonLinkNode(node?.__text, node.__key);
    inheritTemplateTextNode(newNode, node);
    newNode.__href = node.__href;
    newNode.__target = node.__target;
    newNode.__label = node.__label;
    newNode.__processedHref = node.__processedHref;
    newNode.__processedLabel = node.__processedLabel;
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("button");

    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    element.textContent = this.__label;

    return element;
  }

  isEmpty(): boolean {
    return false;
  }

  private __setOnclickAttribute(
    element: HTMLButtonElement,
    href: string
  ): void {
    href = href.replace(/'/g, "\\'");
    const target = this.__target;
    const onclickCode = `(function(){var a=document.createElement('a');a.href='${href}';a.target='${target}';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();document.body.removeChild(a);})()`;
    element.setAttribute("onclick", onclickCode);
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLButtonElement {
    const element = document.createElement("button");

    if (editor) {
      editor.update(() => {
        const { href, label } = this.getWritable().processDataForLoadLink();
        element.textContent = label;
        this.__setOnclickAttribute(element, href);
      });
    }

    return element;
  }

  private processDataForLoadLink(data?: Record<string, any>): {
    href: string;
    label: string;
  } {
    // Process href
    const href = this.__href || "#";
    const label = this.__label || "Button";

    let processedHref = href;
    if (href) {
      processedHref = $processTemplateText(href, {
        data,
        node: this,
      });
    }

    this.__processedHref = processedHref;

    let processedLabel = label;
    if (label) {
      processedLabel = $processTemplateText(label, {
        data,
        node: this,
      });
    }

    return {
      href: processedHref,
      label: processedLabel,
    };
  }

  loadLink(options?: { data?: Record<string, any> }): void {
    let data = options?.data;

    const { href: processedHref, label: processedLabel } =
      this.processDataForLoadLink(data);

    this.__processedHref = processedHref;
    this.__processedLabel = processedLabel;

    this.markDirty();
  }

  updateDOM(
    prevNode: TemplateTextNode & ButtonLinkNode,
    element: HTMLButtonElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    element.textContent = this.__processedLabel;
    this.__setOnclickAttribute(element, this.__processedHref);

    return false;
  }

  static importJSON(serializedNode: SerializedButtonLinkNode): ButtonLinkNode {
    const node = $createButtonLinkNode();

    inheritSerializedTemplateTextNode(node, serializedNode);
    node.__href = serializedNode.__href;
    node.__target = serializedNode.__target;
    node.__label = serializedNode.__label;
    return node;
  }

  exportJSON(): SerializedButtonLinkNode & SerializedTemplateTextNode {
    return {
      ...super.exportJSON(),
      __href: this.__href,
      __target: this.__target,
      __label: this.__label,
      version: 1,
      type: "button-link",
    };
  }
}

export const $createButtonLinkNode = (node?: ButtonLinkNode) => {
  const buttonLink = new ButtonLinkNode();
  inheritTemplateTextNode(buttonLink, node);
  buttonLink.__href = node?.__href || "#";
  buttonLink.__target = node?.__target || "_self";
  buttonLink.__label = node?.__label || "Button";
  buttonLink.__processedHref = node?.__processedHref || "#";
  buttonLink.__processedLabel = node?.__processedLabel || "Button";
  return buttonLink;
};

export const $isButtonLinkNode = (
  node: unknown
): node is ButtonLinkNode & CSS => node instanceof ButtonLinkNode;
