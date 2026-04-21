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
import { SearchBox } from "./client/SearchBox";
import { $afterWPDecoratorNodeCreation } from "../wp/WPDecoratorNode";

export type SearchBoxConfig = {
  targetCollection?: string;
  urlType?: "none" | "query" | "segment";
  placeholder?: string;
  dropdown?: {
    enable?: boolean;
    mainField?: string;
    subtitleField?: string;
  };
};

export type SerializedSearchBoxNode = Spread<
  {
    __config: SearchBoxConfig;
  },
  SerializedReactDecoratorNode
>;

export class SearchBoxNode extends ReactDecoratorNode {
  ID: number;
  __config: SearchBoxConfig = {};
  constructor(ID?: number, key?: NodeKey) {
    super(ID, key);
    this.ID = ID ?? Math.floor(Math.random() * 100000);
  }

  static getType(): string {
    return "searchbox";
  }

  getConfig(): SearchBoxConfig {
    return this.__config;
  }

  isEmpty(): boolean {
    return this.__config.targetCollection ? false : true;
  }

  setConfig(config: SearchBoxConfig): void {
    this.__config = config;
  }

  static clone(node: SearchBoxNode): SearchBoxNode {
    const newNode = new SearchBoxNode(node.ID, node.__key);
    newNode.__config = node.__config;
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(serializedNode: SerializedSearchBoxNode): SearchBoxNode {
    const searchBox = $createSearchBoxNode();
    searchBox.importJSON(serializedNode);
    searchBox.ID = serializedNode.ID;
    searchBox.__config = serializedNode.__config;

    return searchBox;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    return super.createDOM(config, editor);
  }

  updateDOM(
    prevNode: SearchBoxNode,
    element: HTMLElement,
    config: EditorConfig
  ): false {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  decorate(): ReactNode {
    return <SearchBox config={this.__config} />;
  }

  exportJSON(): SerializedSearchBoxNode {
    return {
      ...super.exportJSON(),
      type: "searchbox",
      __config: this.__config,
      version: 1,
    };
  }
}

export const $createSearchBoxNode = (node?: SearchBoxNode) => {
  const SearchBox = new SearchBoxNode();
  SearchBox.__config = node ? node.__config : {};
  $afterWPDecoratorNodeCreation(SearchBox, node);
  return SearchBox;
};

export function $isSearchBoxNode(
  node: LexicalNode | null | undefined
): node is SearchBoxNode {
  return node instanceof SearchBoxNode;
}
