// Runtime guard functions for WP nodes.
// Uses inline require() to avoid circular dependency issues at module init time.
// WPElementNode/WPTextNode/WPDecoratorNode all import collection/sync at the top level,
// whose require() calls resolve back to CollectionNode which imports these node classes —
// so they cannot be statically imported here.

import type { WPLexicalNode } from "./types";
import type { WPElementNode } from "./WPElementNode";
import type { WPTextNode } from "./WPTextNode";

export const $isWPLexicalNode = (node: any): node is WPLexicalNode => {
  if (!node) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { $isWPElementNode } = require("./WPElementNode");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { $isWPTextNode } = require("./WPTextNode");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { $isWPDecoratorNode } = require("./WPDecoratorNode");
  return $isWPElementNode(node) || $isWPTextNode(node) || $isWPDecoratorNode(node);
};

export const $isWPElementOrTextNode = (
  node: any
): node is WPElementNode | WPTextNode => {
  if (!node) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { $isWPElementNode } = require("./WPElementNode");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { $isWPTextNode } = require("./WPTextNode");
  return $isWPElementNode(node) || $isWPTextNode(node);
};
