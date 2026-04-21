// Re-export individual node types and guards
export {
  $isWPDecoratorNode,
  type SerializedWPDecoratorNode,
  WPDecoratorNode,
} from "./WPDecoratorNode";
export {
  $isWPElementNode,
  type SerializedWPElementNode,
  WPElementNode,
} from "./WPElementNode";
export {
  $isWPTextNode,
  type SerializedWPTextNode,
  WPTextNode,
} from "./WPTextNode";

// Re-export types from types.ts to avoid circular dependencies
export type { WPLexicalNode, SerializedWPNode } from "./types";

// Define $isWPLexicalNode here (after imports are resolved) to avoid circular dependency
import { $isWPElementNode, WPElementNode } from "./WPElementNode";
import { $isWPTextNode, WPTextNode } from "./WPTextNode";
import { $isWPDecoratorNode } from "./WPDecoratorNode";
import type { WPLexicalNode } from "./types";

export const $isWPLexicalNode = (node: any): node is WPLexicalNode => {
  return (
    node &&
    ($isWPElementNode(node) || $isWPTextNode(node) || $isWPDecoratorNode(node))
  );
};

export const $isWPElementOrTextNode = (
  node: any
): node is WPElementNode | WPTextNode => {
  return node && ($isWPElementNode(node) || $isWPTextNode(node));
};
