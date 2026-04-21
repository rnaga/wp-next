import type { Klass, LexicalEditor, LexicalNode } from "lexical";

// Deferred wrappers for functions exported from lexical.ts that cannot be
// statically imported by nodes that lexical.ts itself imports (e.g. CollectionNode).

export const $deferredCreateNode = <T extends LexicalNode = LexicalNode>(
  klassNode: Klass<T>,
  args?: any[]
): T => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./lexical").$createNode(klassNode, args);
};

export const $deferredDeepCopy = (...args: any[]): any => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./lexical").$deepCopy(...args);
};

export const deferredFindDataFetchingNodeByCollectionName = (
  editor: LexicalEditor,
  collectionName: string
): ReturnType<
  typeof import("./nodes/collection/CollectionNode")["findDataFetchingNodeByCollectionName"]
> => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./nodes/collection/CollectionNode").findDataFetchingNodeByCollectionName(
    editor,
    collectionName
  );
};

export const deferredWalkNodeWithWidgets = (
  editor: LexicalEditor,
  callback: (
    editor: LexicalEditor,
    node: LexicalNode,
    options: { parentNode?: LexicalNode; templateId?: number }
  ) => void,
  options?: { templateId?: number }
): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./lexical").walkNodeWithWidgets(editor, callback, options);
};
