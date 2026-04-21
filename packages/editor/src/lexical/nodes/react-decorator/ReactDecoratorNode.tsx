import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  $isRootNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import { ReactNode } from "react";
import {
  SerializedWPDecoratorNode,
  WPDecoratorNode,
} from "../wp/WPDecoratorNode";
import { ReactElementDecoratorNode } from "./ReactElementDecoratorNode";
import { $isCollectionNode } from "../collection/CollectionNode";
import { $walkNode } from "../..";
import { createPortal } from "react-dom";
import { WPLexicalNode } from "../wp";

export type SerializedReactDecoratorNode = Spread<
  {
    ID: number;
  },
  SerializedWPDecoratorNode
>;

export const REACT_DECORATOR_DATA_ATTRIBUTE = "data-decorator-id";

export class ReactDecoratorNode extends WPDecoratorNode<ReactNode> {
  ID: number;
  constructor(ID?: number, key?: NodeKey) {
    super(key);
    this.ID = ID ?? Math.floor(Math.random() * 100000);
  }

  isEmpty(): boolean {
    // A decorator node is never empty
    return false;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    element.setAttribute(REACT_DECORATOR_DATA_ATTRIBUTE, this.ID?.toString());

    this.initStyle(element, this.__css, config, editor);
    element.className = this.__css.getAllClassNames();
    this.attachKey(element, config);

    return element;
  }

  updateDOM(
    prevNode: ReactDecoratorNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  decorate(): ReactNode {
    //throw new Error("Method not implemented.");
    return null;
  }

  exportJSON(): SerializedReactDecoratorNode {
    return {
      ...super.exportJSON(),
      type: "",
      format: "start",
      ID: this.ID,
      version: 1,
    };
  }
}

export function $isReactDecoratorNode(
  node: LexicalNode | null | undefined
): node is ReactDecoratorNode {
  return node instanceof ReactDecoratorNode;
}

// Validator for both ReactDecoratorNode and ReactElementDecoratorNode
export function $isReactDecoratorOrElementNode(
  node: LexicalNode | null | undefined
): node is ReactDecoratorNode {
  return (
    node instanceof ReactDecoratorNode ||
    node instanceof ReactElementDecoratorNode
  );
}
