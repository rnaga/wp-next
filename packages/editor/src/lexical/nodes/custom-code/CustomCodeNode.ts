import {
  $getEditor,
  $getRoot,
  DecoratorNode,
  EditorConfig,
  HISTORY_MERGE_TAG,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import type * as types from "../../../types";
import { createVoidElement } from "../wp/create-void-element";

export type SerializedCustomCodeNode = Spread<
  {
    __slugs: Record<types.CustomCodeInjectLocation, string[]>;
  },
  SerializedLexicalNode
>;

export class CustomCodeNode extends DecoratorNode<null> {
  __slugs: Record<types.CustomCodeInjectLocation, string[]> = {
    header: [],
    footer: [],
  };

  constructor(key?: string) {
    super(key);
  }

  static getType(): string {
    return "custom-code";
  }

  static clone(node: CustomCodeNode): CustomCodeNode {
    const newNode = new CustomCodeNode(node.__key);
    newNode.__slugs = {
      header: [...node.__slugs.header],
      footer: [...node.__slugs.footer],
    };
    return newNode;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }

  isEmpty(): boolean {
    return (
      !this.__slugs ||
      (this.__slugs.header.length === 0 && this.__slugs.footer.length === 0)
    );
  }

  createDOM(): HTMLElement {
    const element = createVoidElement();
    return element;
  }

  updateDOM(
    prevNode: CustomCodeNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedCustomCodeNode): CustomCodeNode {
    const node = $createCustomCodeNode();

    // Support migration from legacy string[] format
    if (Array.isArray(serializedNode.__slugs)) {
      node.__slugs = {
        header: (serializedNode.__slugs as unknown as string[]) || [],
        footer: [],
      };
    } else {
      node.__slugs = serializedNode.__slugs || { header: [], footer: [] };
    }

    return node;
  }

  exportJSON(): SerializedCustomCodeNode {
    return {
      ...super.exportJSON(),
      __slugs: this.__slugs,
      type: "custom-code",
      version: 1,
    };
  }
}

export function $createCustomCodeNode(node?: CustomCodeNode): CustomCodeNode {
  const customCode = new CustomCodeNode();
  customCode.__slugs = node?.__slugs || { header: [], footer: [] };
  return customCode;
}

export const $isCustomCodeNode = (
  node: LexicalNode
): node is CustomCodeNode => {
  return node instanceof CustomCodeNode || node.getType() === "custom-code";
};

export const $getCustomCodeNode = (): CustomCodeNode | null => {
  return $getRoot()
    .getChildren()
    .find((node) => node instanceof CustomCodeNode) as CustomCodeNode | null;
};

export const updateCustomCodeSlugs = (
  editor: LexicalEditor,
  location: types.CustomCodeInjectLocation,
  slugs: string[]
): void => {
  const node = editor.getEditorState().read(() => $getCustomCodeNode());
  if (!node) {
    return;
  }

  editor.update(
    () => {
      const writable = node.getWritable();
      writable.__slugs = {
        ...writable.__slugs,
        [location]: Array.from(new Set(slugs)),
      };
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const appendCustomCodeSlug = (
  editor: LexicalEditor,
  location: types.CustomCodeInjectLocation,
  slug: string
): void => {
  const node = editor.getEditorState().read(() => $getCustomCodeNode());
  if (!node) {
    return;
  }

  editor.update(
    () => {
      const writable = node.getWritable();
      if (!writable.__slugs[location].includes(slug)) {
        writable.__slugs = {
          ...writable.__slugs,
          [location]: [...writable.__slugs[location], slug],
        };
      }
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const mergeCustomCodeSlugs = (
  base: string[],
  incoming: string[]
): string[] => {
  const baseSet = new Set(base);
  // Build a map: for each shared item in incoming, track which new items precede it
  const insertBefore = new Map<string, string[]>();
  let pendingNew: string[] = [];

  for (const slug of incoming) {
    if (baseSet.has(slug)) {
      if (pendingNew.length > 0) {
        insertBefore.set(slug, pendingNew);
        pendingNew = [];
      }
    } else {
      pendingNew.push(slug);
    }
  }

  // Walk through base order, inserting new items before their anchors
  const result: string[] = [];
  const used = new Set<string>();

  for (const slug of base) {
    const toInsert = insertBefore.get(slug);
    if (toInsert) {
      for (const s of toInsert) {
        if (!used.has(s)) {
          result.push(s);
          used.add(s);
        }
      }
    }
    if (!used.has(slug)) {
      result.push(slug);
      used.add(slug);
    }
  }

  // Append any remaining new items that came after the last shared item
  for (const s of pendingNew) {
    if (!used.has(s)) {
      result.push(s);
      used.add(s);
    }
  }

  return result;
};
