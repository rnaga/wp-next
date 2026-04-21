import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, LexicalNode, Spread } from "lexical";
import { CSSEditor } from "../../../types";
import type { WPLexicalNode } from "../wp/types";
import { $processTemplateText } from "../template-text/TemplateTextNode";
import { $deferredSyncParentCollections } from "../collection/sync";

export type SerializedLinkNode = Spread<
  {
    __href: string;
    __target: "_blank" | "_self" | "_parent" | "_top";
  },
  SerializedWPElementNode
>;

export class LinkNode extends WPElementNode {
  __href: string = "#";
  __target: "_blank" | "_self" | "_parent" | "_top" = "_self";

  __processedHref: string = "";

  static getType(): string {
    return "link";
  }

  static clone(node: LinkNode): LinkNode {
    const newNode = new LinkNode(node.__key);
    newNode.afterClone(node);
    newNode.__href = node.__href;
    newNode.__target = node.__target;
    newNode.__processedHref = node.__processedHref;
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("a");

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("a");

    element.setAttribute("target", this.__target);

    if (editor) {
      editor.read(() => {
        const { href } = this.processDataForLoadLink();
        element.setAttribute("href", href);
      });
    }

    return element;
  }

  private processDataForLoadLink(data?: Record<string, any>): {
    href: string;
  } {
    const href = this.__href;

    let processedHref = href;
    if (href) {
      processedHref = $processTemplateText(href, {
        data,
        node: this,
      });
    }

    return { href: processedHref };
  }

  loadLink(options?: { data?: Record<string, any> }): void {
    let data = options?.data;

    const { href: processedHref } = this.processDataForLoadLink(data);

    this.__processedHref = processedHref;
    this.markDirty();
  }

  updateDOM(
    prevNode: LinkNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    element.setAttribute("href", this.__processedHref);

    return false;
  }

  static importJSON(serializedNode: SerializedLinkNode): LinkNode {
    const node = $createLinkNode();
    node.importJSON(serializedNode);
    node.__href = serializedNode.__href;
    node.__target = serializedNode.__target;
    return node;
  }

  exportJSON(): SerializedLinkNode {
    return {
      ...super.exportJSON(),
      __href: this.__href,
      __target: this.__target,
      type: "link",
    };
  }
}

export const $createLinkNode = (node?: LinkNode) => {
  const link = new LinkNode();
  $afterWPElementNodeCreation(link, node);
  link.__href = node?.__href ?? "#";
  link.__target = node?.__target ?? "_self";
  return link;
};

export const $isLinkNode = (node: unknown): node is LinkNode & CSS =>
  node instanceof LinkNode;

export const $isLinkRelatedNode = (
  node: WPLexicalNode | LexicalNode | null | undefined
): node is LinkNode &
  CSSEditor & {
    loadLink: (options?: { data?: Record<string, any> }) => void;
  } => node instanceof LinkNode || node?.getType() === "button-link";

export const $loadTemplateLink = (node: LexicalNode) => {
  if (!$isLinkRelatedNode(node)) {
    return;
  }

  const writable = node.getWritable();
  writable.loadLink();

  // Sync other LinkRelatedNode in the same collection if applicable
  $deferredSyncParentCollections(writable);
};
