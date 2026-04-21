// Type definitions for WP nodes - separated to avoid circular dependencies

export type { SerializedWPTextNode } from "./WPTextNode";
export type { SerializedWPElementNode } from "./WPElementNode";
export type { SerializedWPDecoratorNode } from "./WPDecoratorNode";

import type { WPElementNode } from "./WPElementNode";
import type { WPTextNode } from "./WPTextNode";
import type { WPDecoratorNode } from "./WPDecoratorNode";

export type WPLexicalNode = WPElementNode | WPTextNode | WPDecoratorNode<any>;

export type SerializedWPNode =
  | import("./WPTextNode").SerializedWPTextNode
  | import("./WPElementNode").SerializedWPElementNode
  | import("./WPDecoratorNode").SerializedWPDecoratorNode;

// Note: $isWPLexicalNode is defined in index.ts to avoid circular dependency issues
// This file only exports types to be safely imported by css.ts
