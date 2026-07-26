import { $getRoot, ElementNode } from "lexical";

import type { LexicalNode, SerializedElementNode, Spread } from "lexical";

export type SerializedMetaNode = Spread<{}, SerializedElementNode>;

/**
 * Invisible root-level container for editor "metadata" nodes (fonts, cache,
 * css variables, animations, custom code, data-fetching sources, etc).
 *
 * These nodes must never be direct children of RootNode themselves: Lexical's
 * reconciler garbage-collects DecoratorNode instances that are direct root
 * children (see issues/lexical-0.48-root-decorator-gc-bug.md), silently
 * dropping them on the very next commit. Nesting them one level deeper, under
 * this ElementNode, avoids that bug entirely.
 */
export class MetaNode extends ElementNode {
  static getType(): string {
    return "meta";
  }

  static clone(node: MetaNode): MetaNode {
    return new MetaNode(node.__key);
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  static importJSON(_serializedNode: SerializedMetaNode): MetaNode {
    return $createMetaNode();
  }

  exportJSON(): SerializedMetaNode {
    return {
      ...super.exportJSON(),
      type: "meta",
    };
  }
}

export const $createMetaNode = (): MetaNode => new MetaNode();

export const $isMetaNode = (node: unknown): node is MetaNode =>
  node instanceof MetaNode;

/**
 * Throws if MetaNode is missing. Safe to call unconditionally anywhere the
 * editor state has already gone through `parseJsonString`/`parseJsonStringSync`,
 * since those guarantee MetaNode exists (see `defaultRootNodes` in lexical.ts).
 */
export const $getMetaNode = (): MetaNode => {
  const metaNode = $getRoot()
    .getChildren()
    .find($isMetaNode);

  if (!metaNode) {
    throw new Error("MetaNode not found in the editor");
  }

  return metaNode as MetaNode;
};

export const $getOrCreateMetaNode = (): MetaNode => {
  const existing = $getRoot()
    .getChildren()
    .find($isMetaNode) as MetaNode | undefined;

  if (existing) {
    return existing;
  }

  const metaNode = $createMetaNode();
  $getRoot().append(metaNode);
  return metaNode;
};

/**
 * Ensures a singleton child of the given type exists under MetaNode,
 * creating (and creating MetaNode itself) if missing. Mirrors the
 * "append if missing" semantics previously applied directly to root.
 */
export const $ensureMetaChild = <T extends LexicalNode>(
  isNode: (node: LexicalNode) => node is T,
  create: () => T
): T => {
  const metaNode = $getOrCreateMetaNode();
  const existing = metaNode.getChildren().find(isNode);

  if (existing) {
    return existing;
  }

  const node = create();
  metaNode.append(node);
  return node;
};
