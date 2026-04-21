import type { LexicalNode } from "lexical";
import type { CollectionNode } from "./CollectionNode";

// Deferred wrappers to break circular dependencies within the collection module
// and between WP base nodes and CollectionNode.

// --- CollectionNode wrappers (used by WPElementNode/WPTextNode/WPDecoratorNode
//     and CollectionElementNode to avoid mutual static imports) ---

export const $deferredSyncParentCollections = (node: LexicalNode): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./CollectionNode").$syncParentCollections(node);
};

export const $deferredIsCollectionNode = (node: unknown): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./CollectionNode").$isCollectionNode(node);
};

/** Type guard variant for use in CollectionElementNode (avoids static import of CollectionNode). */
export const $isCollectionNodeGuard = (node: unknown): node is CollectionNode => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./CollectionNode").$isCollectionNode(node);
};

// --- Deferred guards for nodes that extend WP base classes ---
// CollectionElementNode needs these but cannot statically import them because
// they extend WPElementNode/WPTextNode which are not yet initialized when
// CollectionElementNode is first evaluated.

export const $deferredIsTemplateTextNode = (node: unknown): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../template-text/TemplateTextNode").$isTemplateTextNode(node);
};

export const $deferredIsLinkRelatedNode = (node: unknown): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../link/LinkNode").$isLinkRelatedNode(node);
};

export const $deferredGetCollectionElementData = (node: unknown): any => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./CollectionElementNode").$getCollectionElementData(node);
};
