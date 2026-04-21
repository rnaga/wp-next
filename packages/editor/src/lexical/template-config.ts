import { $getRoot, LexicalEditor } from "lexical";
import {
  $isDataFetchingNode,
  DataFetchingNode,
} from "./nodes/data-fetching/DataFetchingNode";
import { $walkNode } from "./walk-node";

import type * as types from "../types";

export const $getConfigurableNodeList = () => {
  const nodes: DataFetchingNode[] = [];

  $walkNode($getRoot(), (node) => {
    if (
      $isDataFetchingNode(node) &&
      node.getAllowedQueryPassthroughKeys().length > 0
    ) {
      nodes.push(node);
    }
  });

  return nodes;
};

export const getConfigurableNodeItems = (
  editor: LexicalEditor
): types.ConfigurableNodeItem[] => {
  return editor.read(() => {
    const nodes = $getConfigurableNodeList();
    const items: types.ConfigurableNodeItem[] = [];
    for (const node of nodes) {
      items.push({
        nodeType: node.getType(),
        name: node.getName(),
        queryKeys: node.getAllowedQueryPassthroughKeys(),
      });
    }
    return items;
  });
};
