import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  DecoratorNode,
  EditorConfig,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { WPDecoratorNode } from "../wp";
import { JSX } from "react/jsx-dev-runtime";

export type SerializedWidgetRootNode = Spread<
  {
    ID: number;
    collectionReferenceData?: any;
  },
  SerializedLexicalNode
>;

export class WidgetRootNode extends DecoratorNode<undefined> {
  ID: number = 0;
  collectionReferenceData?: any;
  static getType(): string {
    return "widget-root";
  }

  static clone(node: WidgetRootNode): WidgetRootNode {
    return new WidgetRootNode(node.__key);
  }

  constructor(key?: string) {
    super(key);
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(
    prevNode: WidgetRootNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }

  exportJSON(): SerializedWidgetRootNode {
    return {
      ID: this.ID,
      collectionReferenceData: this.collectionReferenceData,
      type: "widget-root",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedWidgetRootNode): WidgetRootNode {
    const widgetRootNode = new WidgetRootNode();
    widgetRootNode.ID = serializedNode.ID;
    widgetRootNode.collectionReferenceData =
      serializedNode.collectionReferenceData;
    return widgetRootNode;
  }

  decorate() {
    return undefined;
  }
}

export const $createWidgetRootNode = (
  node?: WidgetRootNode
): WidgetRootNode => {
  const widgetRootNode = new WidgetRootNode();
  widgetRootNode.ID = node ? node.ID : 0;
  return widgetRootNode;
};

export const $isWidgetRootNode = (node: any): node is WidgetRootNode =>
  node instanceof WidgetRootNode;
