import {
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical";
import { ReactNode } from "react";
import { REACT_DECORATOR_DATA_ATTRIBUTE } from "./ReactDecoratorNode";
import { processElementDecorator } from "./client/process-element-decorator";
import { SerializedWPElementNode, WPElementNode } from "../wp/WPElementNode";

export type SerializedReactElementDecoratorNode = Spread<
  {
    ID: number;
  },
  SerializedWPElementNode
>;

export class ReactElementDecoratorNode extends WPElementNode {
  ID: number;
  element: HTMLElement = document.createElement("div");
  constructor(ID?: number, key?: NodeKey) {
    super(key);
    this.ID = ID ?? Math.floor(Math.random() * 100000);
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    this.element.setAttribute(
      REACT_DECORATOR_DATA_ATTRIBUTE,
      this.ID?.toString()
    );
    const element = this.element;
    this.initStyle(element, this.__css, _config, _editor);
    element.className = this.__css.getAllClassNames();
    this.attachKey(element, _config);

    return this.element;
  }

  updateDOM(
    prevNode: ReactElementDecoratorNode,
    element: HTMLElement,
    config: EditorConfig
  ): false {
    element = this.element;

    return false;
  }

  static importJSON(
    serializedNode: SerializedReactElementDecoratorNode
  ): ReactElementDecoratorNode {
    const node = new ReactElementDecoratorNode(serializedNode.ID);
    return node;
  }

  processDOM(): void {
    processElementDecorator({
      node: this,
    });
  }

  decorate(): ReactNode {
    //throw new Error("Method not implemented.");
    return null;
  }

  exportJSON(): SerializedReactElementDecoratorNode {
    return {
      ...super.exportJSON(),
      type: "",
      ID: this.ID,
      version: 1,
    };
  }
}

export function $isReactElementDecoratorNode(
  node: LexicalNode | null | undefined
): node is ReactElementDecoratorNode {
  return node instanceof ReactElementDecoratorNode;
}
