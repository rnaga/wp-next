import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import { ReactNode } from "react";

import {
  ReactDecoratorNode,
  SerializedReactDecoratorNode,
} from "../react-decorator/ReactDecoratorNode";
import { Pagination } from "./client/Pagination";
import { $afterWPDecoratorNodeCreation } from "../wp/WPDecoratorNode";

export type PaginationClassNames = {
  container?: string;
  info?: string;
  controls?: string;
  button?: string;
  ellipsis?: string;
};

export type PaginationConfig = {
  targetCollection?: string;
  urlType?: "none" | "query" | "segment";
  classNames?: PaginationClassNames;
  // Query keys to read from the shared query cache (e.g. "search") and forward
  // to every page-change fetch so those values survive pagination.
  additionalQueryKeys?: string[];
};

export type SerializedPaginationNode = Spread<
  {
    __config: PaginationConfig;
  },
  SerializedReactDecoratorNode
>;

export class PaginationNode extends ReactDecoratorNode {
  ID: number;
  __config: PaginationConfig = {};
  constructor(ID?: number, key?: NodeKey) {
    super(ID, key);
    this.ID = ID ?? Math.floor(Math.random() * 100000);
  }

  static getType(): string {
    return "pagination";
  }

  getConfig(): PaginationConfig {
    return this.__config;
  }

  isEmpty(): boolean {
    return this.__config.targetCollection ? false : true;
  }

  setConfig(config: PaginationConfig): void {
    this.__config = config;
  }

  static clone(node: PaginationNode): PaginationNode {
    const newNode = new PaginationNode(node.ID, node.__key);
    newNode.__config = node.__config;
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(serializedNode: SerializedPaginationNode): PaginationNode {
    const pagination = $createPaginationNode();
    pagination.importJSON(serializedNode);
    pagination.ID = serializedNode.ID;
    pagination.__config = serializedNode.__config;
    return pagination;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    return super.createDOM(config, editor);
  }

  updateDOM(
    prevNode: PaginationNode,
    element: HTMLElement,
    config: EditorConfig
  ): false {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  decorate(): ReactNode {
    return <Pagination config={this.__config} />;
  }

  exportJSON(): SerializedPaginationNode {
    return {
      ...super.exportJSON(),
      type: "pagination",
      __config: this.__config,
      version: 1,
    };
  }
}

export const $createPaginationNode = (node?: PaginationNode) => {
  const pagination = new PaginationNode();
  pagination.__config = node ? node.__config : {};
  $afterWPDecoratorNodeCreation(pagination, node);
  return pagination;
};

export function $isPaginationNode(
  node: LexicalNode | null | undefined
): node is PaginationNode {
  return node instanceof PaginationNode;
}
