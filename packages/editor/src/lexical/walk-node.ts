import { $isElementNode, LexicalNode } from "lexical";

export const $isLexicalNode = (node: any): node is LexicalNode => {
  return node && typeof node === "object" && parseInt(node?.__key || 0) > 0;
};

export const $walkNode = (
  node: LexicalNode,
  callback: (node: LexicalNode, parentNode?: LexicalNode) => void,
  parentNode?: LexicalNode
) => {
  callback(node, parentNode);
  if ($isElementNode(node)) {
    node.getChildren().forEach((child) => $walkNode(child, callback, node));
  }
};
