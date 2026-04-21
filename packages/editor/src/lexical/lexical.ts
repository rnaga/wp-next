import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isRootNode,
  EditorConfig,
  ElementNode,
  HISTORY_MERGE_TAG,
  Klass,
  LexicalEditor,
  LexicalNode,
  TextNode,
} from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";

import * as actionsCustomcode from "../server/actions/custom-code";
import { getEditorServerActionsUtils } from "../server/actions/get-editor-server-actions-utils";
import {
  DEFAULT_NODE_CREATED_COMMAND,
  EDITOR_JSON_PARSED_COMMAND,
} from "./commands";
import { parseCustomCode } from "./custom-code";
import {
  isEditorMode,
  isFullScreenPreviewMode,
  isLexicalEditorMode,
  setEditorMode,
  setFullScreenPreviewMode,
} from "./editor-mode";
import { getKlassNodes, registerKlassNode } from "./klass-registry";
import {
  $isAnimationNode,
  AnimationNode,
} from "./nodes/animation/AnimationNode";
import {
  $getAllCacheData,
  $getAllQueryCache,
  $getCacheData,
  $isCacheNode,
  $storeCacheData,
  CacheNode,
} from "./nodes/cache/CacheNode";
import {
  $findParentCollectionElementNode,
  $isCollectionElementNode,
} from "./nodes/collection/CollectionElementNode";
import {
  $isCollectionNode,
  $syncCollectionElementNodesInCollection,
  $syncParentCollections,
} from "./nodes/collection/CollectionNode";
import {
  $isCSSVariablesNode,
  CSSVariablesNode,
} from "./nodes/css-variables/CSSVariablesNode";
import {
  $isDataFetchingNode,
  fetchAllDataFetchingNodes,
} from "./nodes/data-fetching/DataFetchingNode";
import { $isCustomFontNode, CustomFontNode } from "./nodes/font/CustomFontNode";
import { $isGoogleFontNode, GoogleFontNode } from "./nodes/font/GoogleFontNode";
import { $isLinkRelatedNode, $loadTemplateLink } from "./nodes/link/LinkNode";
import { $isReactDecoratorNode } from "./nodes/react-decorator/ReactDecoratorNode";
import {
  $isTemplateTextNode,
  $loadTemplateText,
} from "./nodes/template-text/TemplateTextNode";
import { $isWidgetNode, WidgetNode } from "./nodes/widget/WidgetNode";
import { $isWPLexicalNode } from "./nodes/wp/guards";
import type { WPLexicalNode } from "./nodes/wp/types";
import { $isWPElementNode, WPElementNode } from "./nodes/wp/WPElementNode";
import { hasCSS } from "./styles-core/css";
import { $walkNode } from "./walk-node";

import type * as types from "../types";
import {
  $isCustomCodeNode,
  CustomCodeNode,
  mergeCustomCodeSlugs,
} from "./nodes/custom-code/CustomCodeNode";
import { CUSTOM_CODE_INJECT_LOCATIONS } from "./nodes/custom-code/constants";
import { $isBodyNode, BodyNode } from "./nodes/body/BodyNode";
import { logger } from "./logger";

export const defaultNodes: Array<
  [Klass<LexicalNode>, (...args: any[]) => boolean]
> = [
  [GoogleFontNode, $isGoogleFontNode],
  [CustomFontNode, $isCustomFontNode],
  [CSSVariablesNode, $isCSSVariablesNode],
  [AnimationNode, $isAnimationNode],
  [CustomCodeNode, $isCustomCodeNode],
  [CacheNode, $isCacheNode],
  [BodyNode, $isBodyNode],
];

const creators = new Map<Klass<LexicalNode>, (...args: any[]) => LexicalNode>([
  [TextNode, $createTextNode],
]);

// Create an empty history state for lexical node
export const lexicalHistoryState = createEmptyHistoryState();

export {
  isEditorMode,
  isFullScreenPreviewMode,
  isLexicalEditorMode,
  setEditorMode,
  setFullScreenPreviewMode,
};

export { getKlassNodes } from "./klass-registry";

export const registerNodeCreator = (
  klass: Klass<LexicalNode>,
  create: (...args: any[]) => LexicalNode
) => {
  creators.set(klass, create);

  // Push the klass node to the global array of klass nodes
  registerKlassNode(klass);
};

function isSubclass<T>(
  subClass: new () => T,
  superClass: new () => T
): boolean {
  return superClass.prototype.isPrototypeOf(subClass.prototype);
}

export const isElementNodeClass = (klass: Klass<LexicalNode>) => {
  return isSubclass(klass, ElementNode);
};

export const isTextNodeClass = (klass: Klass<LexicalNode>) => {
  return isSubclass(klass, TextNode as Klass<LexicalNode>);
};

export const $getKlassNodeByType = (type: string) => {
  const clazz = getKlassNodes().find((clazz) => clazz.getType() === type);

  if (!clazz) {
    throw new Error(`Node type ${type} not found`);
  }

  return clazz;
};

export const $createNode = <T extends LexicalNode = LexicalNode>(
  klassNode: Klass<T>,
  args?: any[]
) => {
  const create = creators.get(klassNode);
  if (!create) {
    throw new Error(`No creator found for node type ${klassNode}`);
  }

  const node = create(...(args || []));

  return node as T;
};

export const $getNodeAndDOMfromKey = (
  nodeKey: string,
  editor: LexicalEditor
) => {
  const node = $getNodeByKey(nodeKey);
  const element = editor.getElementByKey(nodeKey);

  return { node, element };
};

export const $isLexicalNode = (node: any): node is LexicalNode => {
  return node && typeof node === "object" && parseInt(node?.__key || 0) > 0;
};

export const $getNodeFromDOM = (
  element: any,
  editor: LexicalEditor
): LexicalNode | null => {
  // __lexicalKey_ is used by Lexical code base, whereas __lexicalkey_ is custom key used by tree navigator
  // __lexicalkey_ is used because React doesn't like uppercase attributes
  // __lexical__node_key__ is set by WPLexicalNode
  let nodeKey = element?.[`__lexicalKey_${editor._key}`];

  if (!nodeKey && element?.getAttribute) {
    nodeKey = element?.getAttribute(`__lexicalkey_${editor._key}`);
  }

  if (!nodeKey && element?.getAttribute) {
    nodeKey = element?.getAttribute(`__lexical__node_key__`);
  }

  if (!nodeKey) {
    return null;
  }

  return $getNodeByKey(nodeKey);
};

export const $removeNode = (
  node?: LexicalNode | null,
  options?: {
    force: boolean;
    preserveEmptyParent?: boolean;
  }
) => {
  const { preserveEmptyParent, force } = options || {};
  // Skip if __removable is false and options.force is not true
  if (
    !node ||
    (true !== force && $isWPLexicalNode(node) && !node.__removable)
  ) {
    return;
  }

  const parentNode = node.getParent();
  node.remove(preserveEmptyParent);

  parentNode && $syncParentCollections(parentNode);
};

export const $isNodeEditableContextMenu = (node: WPLexicalNode) => {
  return node.__editableContextMenu;
};

export const $isNodeEditableMouseTool = (node: WPLexicalNode) => {
  return node.__editableMouseTool;
};

export const $deepCopy = (
  node: WPElementNode,
  options?: {
    exclude?: WPLexicalNode[];
  }
): WPElementNode => {
  const { exclude = [] } = options ?? {};
  const elementKlassNode = $getKlassNodeByType(node.getType());
  const newNode = $createNode(elementKlassNode, [node]) as WPElementNode;

  const children = node.getChildren();
  for (const child of children) {
    const klassNode = $getKlassNodeByType(child.getType());

    const shouldExclude = exclude.find(
      (node) => node.getKey() === child.getKey()
    );

    if (shouldExclude) {
      logger.log( "Excluding node from copy", shouldExclude);
      continue;
    }

    let clonedNode: LexicalNode;
    if ($isWPElementNode(child)) {
      clonedNode = $deepCopy(child, options);
    } else {
      clonedNode = $createNode(klassNode, [child]);
    }

    newNode.attach(clonedNode, {
      syncCollection: false,
    });
  }

  return newNode;
};

type NodeStack = {
  node: WPElementNode | WPLexicalNode;
  children: NodeStack[];
};

//
/**
 * $nodeToStack and $createFromStack are used to deep copy node between different LexicalEditor instances
 *
 * Example usage:
 * const tmpEditor = createEditor({editorState: copiedEditorState});
 * const stack = tmpEditor.read(() => $nodeToStack(node));
 * const newNode = $createFromStack(stack);
 *
 * @param node
 * @returns
 */
export const $nodeToStack = (
  node: WPElementNode | WPLexicalNode
): NodeStack => {
  const stack: NodeStack = {
    node: node,
    children: [],
  };

  if (!$isWPElementNode(node)) {
    return stack;
  }

  const children = node.getChildren();
  for (const child of children) {
    if ($isWPElementNode(child)) {
      stack.children.push($nodeToStack(child));
    } else {
      stack.children.push({
        node: child as WPLexicalNode,
        children: [],
      });
    }
  }

  return stack;
};

export const $createFromStack = (
  stack: NodeStack,
  options?: {
    copyCSSClassName?: boolean;
  }
): WPLexicalNode => {
  const { node, children } = stack;
  const { copyCSSClassName = false } = options || {};

  const klassNode = $getKlassNodeByType(node.getType());
  const newNode = $createNode(klassNode, [node]) as WPLexicalNode;

  if (!$isWPElementNode(newNode)) {
    if (!copyCSSClassName) {
      // Reset CSS Classname
      newNode.__css.resetClassName();
    }

    return newNode;
  }

  for (const child of children) {
    newNode.attach($createFromStack(child, options), { syncCollection: false });
  }

  return newNode;
};

export { $walkNode } from "./walk-node";

// Walk through child nodes and load template text nodes and refresh collection nodes
export const $refreshNode = (node: LexicalNode) => {
  $walkNode(node, (node) => {
    if ($isCollectionNode(node)) {
      $syncCollectionElementNodesInCollection(node);
    } else if ($isTemplateTextNode(node) || $isLinkRelatedNode(node)) {
      // Check if this TemplateTextNode is inside a CollectionNode
      // If so, skip it because CollectionNode.refreshData() will handle it
      const hasCollectionNodeParent = node.getParents().some($isCollectionNode);

      if (!hasCollectionNodeParent) {
        // Load template text node with context data from parent
        // Only for TemplateTextNodes NOT inside collections
        if ($isTemplateTextNode(node)) {
          $loadTemplateText(node);
        }

        if ($isLinkRelatedNode(node)) {
          $loadTemplateLink(node);
        }
      }
      // Skip if TemplateTextNode is inside CollectionNode because it will be handled by CollectionNode.refreshData()
    }
  });
};

export const $generateStyle = () => {
  const rootNode = $getRoot();
  let style = "";
  $walkNode(rootNode, (node) => {
    if (hasCSS(node)) {
      style = style + node.__css.toString();
    }
  });

  return style;
};

/**
 * Recursively traverses all Lexical editors in the tree, including nested editors
 * embedded within WidgetNodes. Executes a callback for each editor with its parent context.
 */
export const walkAllEditors = (
  rootEditor: LexicalEditor,
  callback: (
    editor: LexicalEditor,
    options?: {
      parentEditor: LexicalEditor | null;
    }
  ) => void
) => {
  const allEditors: {
    editor: LexicalEditor;
    parentEditor: LexicalEditor | null;
  }[] = [{ editor: rootEditor, parentEditor: null }];

  const innerFn = (editor: LexicalEditor) => {
    const widgetEditors: LexicalEditor[] = [];
    editor.read(() => {
      $walkNode($getRoot(), (node) => {
        if ($isWidgetNode(node) && node.editor) {
          allEditors.push({
            editor: node.editor,
            parentEditor: editor,
          });
          widgetEditors.push(node.editor);
        }
      });
    });

    if (widgetEditors.length > 0) {
      for (const widgetEditor of widgetEditors) {
        innerFn(widgetEditor);
      }
    }
  };

  innerFn(rootEditor);

  for (const { editor, parentEditor } of allEditors) {
    callback(editor, {
      parentEditor,
    });
  }
};

// Walk through all nodes including widget nodes
// Note: This function can be used only after processAllWidgets has been called and
// all widget nodes have been initialized with their editors.
export const walkNodeWithWidgets = (
  editor: LexicalEditor,
  callback: (
    editor: LexicalEditor,
    node: LexicalNode,
    options: { parentNode?: LexicalNode; templateSlug?: string }
  ) => void,
  options?: {
    templateSlug?: string;
  }
) => {
  const widgets: { widgetNode: WidgetNode; templateSlug: string }[] = [];
  let { templateSlug = "" } = options || {};

  const nodes: [
    LexicalNode,
    {
      parentNode?: LexicalNode;
    },
  ][] = [];

  editor.read(() => {
    if (templateSlug === "") {
      // Try to get templateSlug from CacheNode
      const query = $getAllQueryCache();
      if (query && query.templateSlug) {
        templateSlug = query.templateSlug;
      }
    }

    $walkNode($getRoot(), (node, parentNode) => {
      if ($isWidgetNode(node)) {
        // Collect widget nodes
        widgets.push({ widgetNode: node, templateSlug: node.slug });
      }
      nodes.push([node, { parentNode }]);
    });
  });

  for (const [node, { parentNode }] of nodes) {
    callback(editor, node, { parentNode, templateSlug });
  }

  if (widgets.length > 0) {
    // Process all widgets after walking nodes
    for (const widget of widgets) {
      // Get editor in WidgetNode
      const { widgetNode, templateSlug } = widget;
      const widgetEditor = widgetNode.editor;

      widgetEditor &&
        walkNodeWithWidgets(widgetEditor, callback, { templateSlug });
    }
  }
};

export const parseJsonString = (
  editor: LexicalEditor,
  content?: string
): Promise<LexicalEditor["_editorState"]> =>
  new Promise((resolve, reject) => {
    const serverActions = getEditorServerActionsUtils();

    let cachedData: ReturnType<typeof $getAllCacheData> | undefined;

    if (content) {
      let jsonString: string | undefined;
      try {
        JSON.parse(content);
        jsonString = content;
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
        return;
      }

      // Get existing CacheNode data before setting the new editor state from JSON string
      // This is needed since editor.setEditorState wipes out existing nodes including CacheNode.
      cachedData = editor.read(() => $getAllCacheData());

      const editorState = editor.parseEditorState(jsonString);
      if (!editorState.isEmpty()) {
        editor.update(
          () => {
            editor.setEditorState(editorState);
          },
          { discrete: true, tag: HISTORY_MERGE_TAG }
        );
      }
    }

    // Create and append default nodes
    editor.update(
      () => {
        const rootNode = $getRoot();
        for (const [klass, $isNode] of defaultNodes) {
          if (!rootNode.getChildren().find($isNode)) {
            rootNode.append($createNode(klass));
            editor.dispatchCommand(DEFAULT_NODE_CREATED_COMMAND, {
              klass,
              node: rootNode.getChildren().find($isNode)!,
            });
          }
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    // Walk through child nodes right under root node
    // And add nodes to BodyNode if
    // 1) they are not default nodes,
    // 2) they are not data fetching nodes
    editor.update(
      () => {
        const rootNode = $getRoot();
        const defaultNodeCheckers = defaultNodes.map(([, $isNode]) => $isNode);
        const isDefaultNode = (node: LexicalNode) =>
          defaultNodeCheckers.some((check) => check(node));

        const bodyNode = rootNode.getChildren().find($isBodyNode);
        if (!bodyNode) return;

        const childrenToMove = rootNode
          .getChildren()
          .filter(
            (child) => !isDefaultNode(child) && !$isDataFetchingNode(child)
          );

        for (const child of childrenToMove) {
          bodyNode.append(child);
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    // Restore the CacheNode data back into the editor
    if (cachedData) {
      editor.update(
        () => {
          $storeCacheData(cachedData ?? {});
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    fetchAllDataFetchingNodes(editor, serverActions)
      .then(() => {
        // Refresh collection nodes and load template text nodes tied to data nodes
        editor.update(
          () => {
            const rootNode = $getRoot();
            $refreshNode(rootNode);
          },
          {
            discrete: true,
            tag: HISTORY_MERGE_TAG,
          }
        );

        // Get the latest editor state and resolve
        const editorState = editor.getEditorState();

        editor.dispatchCommand(EDITOR_JSON_PARSED_COMMAND, {
          editorState,
        });
        resolve(editorState);
      })
      .catch((error) => {
        // Propagate "not found" errors so callers (e.g. getWpPage) can return
        // a proper 404 response via notFound() rather than silently rendering
        // a page without its data.
        if (`${error}`.toLowerCase().includes("not found")) {
          reject(error);
          return;
        }

        logger.error( "Error fetching data fetching nodes:", error);

        // Resolve with current editor state even on error so the promise
        // does not hang indefinitely.
        resolve(editor.getEditorState());
      });
  });

export const parseJsonStringSync = (
  editor: LexicalEditor,
  content: string
): LexicalEditor["_editorState"] => {
  let jsonString: string | undefined;
  try {
    JSON.parse(content);
    jsonString = content;
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }

  // What's happening here - Very important steps:
  // - Get existing CacheNode data before setting the new editor state from JSON string
  // - Re-build the editor state from JSON string, which wipes out the existing CacheNode data (that's why we saved it before)
  // - Append default nodes if they don't exist
  // - Restore the CacheNode data back into the editor
  // This ensures that CacheNode data is preserved across editor state resets from JSON strings
  const cacheData = editor.read(() => $getAllCacheData());

  let editorState = editor.parseEditorState(jsonString);
  if (!editorState.isEmpty()) {
    editor.update(
      () => {
        editor.setEditorState(editorState);
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );
  }

  // Create and append default nodes
  editor.update(
    () => {
      const rootNode = $getRoot();
      defaultNodes.forEach(([klass, $isNode]) => {
        if (!rootNode.getChildren().find($isNode)) {
          rootNode.append($createNode(klass));
          editor.dispatchCommand(DEFAULT_NODE_CREATED_COMMAND, {
            klass,
            node: rootNode.getChildren().find($isNode)!,
          });
        }
      });

      $storeCacheData(cacheData ?? {});
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  editor.update(
    () => {
      const rootNode = $getRoot();
      $refreshNode(rootNode);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  // Get the latest editor state and resolve
  editorState = editor.getEditorState();

  editor.dispatchCommand(EDITOR_JSON_PARSED_COMMAND, {
    editorState,
  });

  return editorState;
};

export const $isChildOfNode = (
  childNode: LexicalNode | null,
  targetParentNode: LexicalNode
) => {
  if (!childNode) {
    return false;
  }

  let parentNode = childNode.getParent();
  while (parentNode) {
    if (parentNode.getKey() === targetParentNode.getKey()) {
      return true;
    }
    parentNode = parentNode.getParent();
  }
  return false;
};

/**
 * Generates HTML from a WPLexicalNode and returns the HTML element
 * @param editor - The Lexical editor instance
 * @param node - The WPLexicalNode to convert to HTML
 * @param index - Optional index to select a specific element when multiple elements match the CSS class.
 *                If not provided and the node is inside a CollectionElementNode, the index is automatically
 *                determined based on the CollectionElementNode's position within its parent CollectionNode.
 * @returns The HTML element or null if not found
 */
export const $generateHtmlFromNode = (
  editor: LexicalEditor,
  node: WPLexicalNode,
  index?: number
): Element | null => {
  const cssClassName = node.__css.getClassName();

  // Generate HTML from editor
  const htmlString = $generateHtmlFromNodes(editor);

  // Convert HTML string to DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Get element(s) by CSS class name
  const elements = doc.querySelectorAll(`.${cssClassName}`);

  // If only one element found, return it immediately
  if (elements.length === 1) {
    return elements[0] ?? null;
  }

  // Determine the index to use
  let targetIndex = index ?? 0;

  // If index is not explicitly provided and multiple elements exist,
  // check if the node is within a CollectionElementNode
  if (index === undefined && elements.length > 1) {
    const parentCollectionElementNode = $findParentCollectionElementNode(node);

    if (parentCollectionElementNode) {
      // Get the parent CollectionNode
      const parentCollectionNode = parentCollectionElementNode.getParent();

      if ($isCollectionNode(parentCollectionNode)) {
        // Find the index of this CollectionElementNode within the parent CollectionNode
        const collectionElementNodes = parentCollectionNode
          .getChildren()
          .filter($isCollectionElementNode);

        const elementIndex = collectionElementNodes.findIndex(
          (n) => n.getKey() === parentCollectionElementNode.getKey()
        );

        if (elementIndex !== -1) {
          targetIndex = elementIndex;
        }
      }
    }
  }

  // Return element at target index, or null if not found
  return elements[targetIndex] ?? null;
};

export const resetEditor = (editor: LexicalEditor) => {
  // Reset the editor by setting an empty root node
  editor.update(() => {
    const rootNode = $getRoot();
    rootNode.clear();
  });
};

// TODO: Can't place this in custom-code.ts because of circular dependency

// This function collects custom code slugs from CustomCodeNodes across the editor and its nested widget editors,
// then fetches the corresponding custom code data from the server based (getCustomCodesBySlugs) and returns it.
// This is used to ensure that all custom code data is available in the editor context, even for custom codes used within widgets.

export const getAllCustomCodes = async (
  rootEditor: LexicalEditor
): Promise<
  Record<
    types.CustomCodeInjectLocation,
    Awaited<ReturnType<typeof actionsCustomcode.getBySlugs>>["data"]
  >
> => {
  const slugs = getAllCustomCodeSlugs(rootEditor);

  const result: Record<
    types.CustomCodeInjectLocation,
    Awaited<ReturnType<typeof actionsCustomcode.getBySlugs>>["data"]
  > = {
    header: [],
    footer: [],
  };

  for (const location of CUSTOM_CODE_INJECT_LOCATIONS) {
    if (slugs[location].length === 0) {
      continue;
    }
    const { data } = await actionsCustomcode.getBySlugs(slugs[location]);
    result[location] = data;
  }

  return result;
};

// TODO: Can't place this in custom-code.ts because of circular dependency

// This function collects all custom code slugs from CustomCodeNodes across the editor and its nested widget editors.
// It returns a Record keyed by InjectLocation with arrays of unique slugs per location.
export const getAllCustomCodeSlugs = (
  editor: LexicalEditor
): Record<types.CustomCodeInjectLocation, string[]> => {
  const slugs: Record<types.CustomCodeInjectLocation, string[]> = {
    header: [],
    footer: [],
  };

  walkNodeWithWidgets(editor, (nestedEditor, node) => {
    nestedEditor.read(() => {
      if ($isCustomCodeNode(node)) {
        slugs.header = mergeCustomCodeSlugs(slugs.header, node.__slugs.header);
        slugs.footer = mergeCustomCodeSlugs(slugs.footer, node.__slugs.footer);
      }
    });
  });

  return slugs;
};
