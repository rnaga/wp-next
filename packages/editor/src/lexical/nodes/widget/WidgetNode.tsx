import {
  $getEditor,
  $getNodeByKey,
  $getRoot,
  $isRootNode,
  createCommand,
  HISTORY_MERGE_TAG,
} from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";

import * as actionsTemplate from "../../../server/actions/template";
import { CSS } from "../../styles-core/css";
import { $walkNode } from "../../walk-node";
import {
  $getAllCacheData,
  $getAllURLQueryCache,
  $getCacheData,
  $getQueryCache,
  $storeCacheData,
  storeURLQueryCache,
} from "../cache/CacheNode";
import { $deferredGetCollectionElementData } from "../collection/sync";
import { $storeFetchedData } from "../data-fetching/DataFetchingNode";
import {
  $afterWPDecoratorNodeCreation,
  WPDecoratorNode,
} from "../wp/WPDecoratorNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import type * as types from "../../../types";
import { DEFAULT_TEMPLATE_JSON_STRING_CONTENT } from "../../constants";
import { gzipJSON, gzipString } from "../../gzip";
import { logger } from "../../logger";

type CollectionElementData = {
  index: number;
  dataKey: string;
};

type CreateLexicalEditor = typeof import("../../editor").createLexicalEditor;
type ParseJsonString = typeof import("../../lexical").parseJsonString;
type ParseJsonStringSync = typeof import("../../lexical").parseJsonStringSync;

const createNestedEditor = (parentEditor: LexicalEditor) => {
  // Defer loading to avoid circular dependency with nodes/index -> WidgetNode.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createLexicalEditor } = require("../../editor") as {
    createLexicalEditor: CreateLexicalEditor;
  };
  return createLexicalEditor({ parentEditor });
};

const parseJsonStringAsync = (
  editor: LexicalEditor,
  content?: string
): ReturnType<ParseJsonString> => {
  // Defer loading to avoid circular dependency with lexical.ts -> WidgetNode.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseJsonString } = require("../../lexical") as {
    parseJsonString: ParseJsonString;
  };
  return parseJsonString(editor, content);
};

const parseJsonStringSyncLocal = (
  editor: LexicalEditor,
  content: string
): ReturnType<ParseJsonStringSync> => {
  // Defer loading to avoid circular dependency with lexical.ts -> WidgetNode.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseJsonStringSync } = require("../../lexical") as {
    parseJsonStringSync: ParseJsonStringSync;
  };
  return parseJsonStringSync(editor, content);
};

export type SerializedWidgetNode = Spread<
  {
    slug: string;
    collectionElementData?: CollectionElementData;
    widgetVariantValues?: Record<string, string | number | boolean>;
    __css: Record<string, any>;
  },
  SerializedDecoratorBlockNode
>;

export class WidgetNode extends WPDecoratorNode<undefined> {
  slug: string = "";
  widgetVariantValues?: Record<string, string | number | boolean>;

  collectionElementData?: CollectionElementData;
  parentEditor: LexicalEditor | null = null;
  editor: LexicalEditor | null = null;
  //editorState: string = "";
  innerHTML: string = "";
  htmlIncrementalId: number = 0;

  static getType(): string {
    return "widget";
  }

  constructor(key?: string) {
    super(key);
  }

  static clone(node: WidgetNode): WidgetNode {
    const newNode = new WidgetNode(node.__key);
    newNode.slug = node.slug;
    newNode.widgetVariantValues = node.widgetVariantValues
      ? structuredClone(node.widgetVariantValues)
      : undefined;
    newNode.parentEditor = node.parentEditor;
    newNode.editor = node.editor;
    newNode.innerHTML = node.innerHTML;
    newNode.afterClone(node);
    return newNode;
  }

  generateHtmlString(): string {
    const editor = this.editor;
    if (!editor) {
      return "";
    }

    const htmlString = editor
      //.getEditorState()
      .read(() => $generateHtmlFromNodes(editor as LexicalEditor, null));

    return htmlString;
  }

  decorate() {
    return undefined;
  }

  isEmpty(): boolean {
    return this.slug?.length === 0;
  }

  getEmptyText(): string {
    return `Widget Node - No Widget Selected ${this.__key}`;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");

    this.__css.setDefault({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });
    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    element.innerHTML = this.generateHtmlString();
    return element;
  }

  updateDOM(
    prevNode: WidgetNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    // Prevent overwriting innerHTML when it was updated programmatically (e.g., from updateWidgetInnerHTML).
    // The htmlIncrementalId acts as a version marker: when innerHTML is updated programmatically,
    // htmlIncrementalId is also incremented. If htmlIncrementalId changed between prevNode and this,
    // it means innerHTML was just updated and the DOM element already reflects the latest content.
    // Overwriting it here would replace React-rendered decorators with stale innerHTML.
    if (this.htmlIncrementalId === prevNode.htmlIncrementalId) {
      // htmlIncrementalId hasn't changed, so this update came from other node changes.
      // Safe to update the DOM element with the current innerHTML.
      element.innerHTML = this.innerHTML;
    } else if (this.innerHTML !== element.innerHTML) {
      // htmlIncrementalId changed (innerHTML was updated programmatically), but the DOM
      // element's innerHTML differs from the node's innerHTML. Sync the node to match the DOM.
      this.innerHTML = element.innerHTML;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedWidgetNode): WidgetNode {
    const node = $createWidgetNode();
    node.slug = serializedNode.slug;
    node.widgetVariantValues = serializedNode.widgetVariantValues
      ? structuredClone(serializedNode.widgetVariantValues)
      : undefined;

    if (serializedNode.collectionElementData) {
      node.collectionElementData = structuredClone(
        serializedNode.collectionElementData
      );
    }
    node.importJSON(serializedNode);

    return node;
  }

  exportJSON(): SerializedWidgetNode {
    return {
      ...super.exportJSON(),
      slug: this.slug || "",
      widgetVariantValues: this.widgetVariantValues
        ? structuredClone(this.widgetVariantValues)
        : undefined,
      collectionElementData: this.collectionElementData
        ? structuredClone(this.collectionElementData)
        : undefined,
      // editorState: this.editorState,
      type: "widget",
      version: 1,
    };
  }
}

export const $createWidgetNode = (node?: WidgetNode) => {
  const widget = new WidgetNode();
  $afterWPDecoratorNodeCreation(widget, node);
  widget.slug = node?.slug || "";
  widget.widgetVariantValues = node?.widgetVariantValues
    ? structuredClone(node.widgetVariantValues)
    : undefined;
  widget.editor = node?.editor || null;
  widget.innerHTML = node?.innerHTML || "";
  return widget;
};

export const $isWidgetNode = (node: unknown): node is WidgetNode & CSS =>
  node instanceof WidgetNode && node.getType() === "widget";

/**
 * Returns true if widgetVariants are configured in the template (stored in query cache).
 * Must be called within an editor read/update context.
 */
export const $widgetVariantsExist = (): boolean => {
  const variants = $getQueryCache("widgetVariants") as
    | types.WidgetVariants
    | undefined;
  return !!variants && Object.keys(variants).length > 0;
};

export const processWidget = async (args: {
  nodeKey: string;
  editor: LexicalEditor;
  options?: {
    forceUpdate?: boolean;
    preload?: Pick<types.PreloadedTemplateMapping, "widgetEditorState">;
  };
}): Promise<[LexicalEditor, string]> => {
  const { options } = args || {};
  const { nodeKey, editor } = args;

  // Get all cache data from parent editor
  const parentEditorCacheData = editor.read(() => $getAllCacheData());

  // Cache might contain widget global cached data
  const widgetGlobalCacheData =
    parentEditorCacheData?.["widget_global_cached_data"];

  const nestedEditor = createNestedEditor(editor);

  let widgetNode: WidgetNode | null = editor.read(() => $getNodeByKey(nodeKey));
  if (!widgetNode || !$isWidgetNode(widgetNode)) {
    logger.warn( "Widget node not found or invalid for key:", nodeKey);
    return [nestedEditor, ""];
  }

  const widgetNodeSlug = widgetNode.slug;

  let editorStateString =
    options?.preload?.widgetEditorState?.[widgetNode.slug] ??
    editor.read(
      () => $getCacheData<string>(getWidgetEditorStateCacheKey(widgetNodeSlug)) // //widgetNodeId))
    );

  // Always fetch the template to get widgetVariants defaults.
  // actionsTemplate.get is cached by Next.js so this is effectively free
  // when the editor state is already available in the cache.
  const { data: widgetTemplate } = await actionsTemplate.get(widgetNode.slug);
  const widgetVariantDefs: types.WidgetVariants =
    widgetTemplate?.template_config?.widgetVariants ?? {};

  if (
    options?.forceUpdate ||
    !editorStateString ||
    0 >= editorStateString.length
  ) {
    editorStateString =
      widgetTemplate?.post_content ?? DEFAULT_TEMPLATE_JSON_STRING_CONTENT;
  }

  // Check if editorStateString is valid JSON
  try {
    JSON.parse(editorStateString);
  } catch (e) {
    logger.error(
      "Invalid JSON for widget editor state:",
      editorStateString,
      e
    );
    editorStateString = DEFAULT_TEMPLATE_JSON_STRING_CONTENT;
  }

  let editorState = editor.parseEditorState(editorStateString as string);
  nestedEditor.update(
    () => {
      // Initialize the nested editor with the widget's saved editor state.
      // IMPORTANT: setEditorState() recreates all nodes from the serialized state (JSON),
      // which regenerates the entire node tree. However, this also clears all cache data
      // in the nested editor. We'll restore the cache in the next step from the parent editor.
      nestedEditor.setEditorState(editorState);
    },
    { discrete: true, tag: HISTORY_MERGE_TAG }
  );

  // Restore all cached data from parent editor
  nestedEditor.update(
    () => {
      // if there's widget global cached data, restore that first
      // then fall back to parent editor cache data
      $storeCacheData(widgetGlobalCacheData ?? parentEditorCacheData ?? {});
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  // IMPORTANT: Propagate query parameters from parent editor to nested widget editor
  // This ensures URL query strings are available in the widget's editor hierarchy.
  // Query cache flows: root editor → widget editor → nested widgets (if any).
  // This step is critical for widgets that perform data fetching or conditional rendering
  // based on URL parameters.
  const urlQueryCache = editor.read(() => $getAllURLQueryCache());
  if (urlQueryCache) {
    storeURLQueryCache(nestedEditor, urlQueryCache);
  }

  // Compute context-specific data from parent CollectionElementNode (if exists)
  // This is critical for widgets inside collections: each collection element has unique data
  // (e.g., array item at index 0 has different data than index 1). By walking up the node tree
  // to find the nearest CollectionElementNode, we get the specific data for THIS instance.
  const collectionElementData = editor.read(() =>
    $deferredGetCollectionElementData(widgetNode)
  );

  if (collectionElementData) {
    // Store collection element data in the nested editor's cache.
    // IMPORTANT: This data is context-specific and overrides the parent editor's cache.
    // For example, if a widget template references "item.name", each collection element
    // will have a different value for "item". By storing it here after restoring the parent
    // cache, we ensure this widget instance gets the correct data for its position in the collection.
    nestedEditor.update(
      () => {
        for (const [key, value] of Object.entries(collectionElementData)) {
          $storeFetchedData(key, value);
        }
      },
      {
        discrete: true,
      }
    );
  }

  // Build variant data by merging template defaults with node-specific values.
  // Defaults are the base; values explicitly set on the widget instance take precedence.
  // This ensures ${%variant.variantName} resolves even when no value is set on the node.
  const variantDefaults: Record<string, string | number | boolean> = {};
  for (const [varName, [varType, defVal]] of Object.entries(
    widgetVariantDefs
  )) {
    if (varType !== "boolean" && defVal !== null)
      variantDefaults[varName] = defVal;
  }
  const variantData = {
    ...variantDefaults,
    ...(widgetNode.widgetVariantValues ?? {}),
  };
  if (Object.keys(variantData).length > 0) {
    nestedEditor.update(
      () => {
        $storeFetchedData("%variant", variantData);
      },
      {
        discrete: true,
      }
    );
  }

  // Process and update nodes in the nested editor.
  const newEditorState = await parseJsonStringAsync(nestedEditor);

  const htmlString = nestedEditor
    //.getEditorState()
    .read(() => $generateHtmlFromNodes(nestedEditor, null));

  const cachedData = nestedEditor.read(() => $getAllCacheData());

  // Get the node again since the editor has been updated - the node reference is stale
  widgetNode = editor.read(() => $getNodeByKey(nodeKey));
  if (!widgetNode || !$isWidgetNode(widgetNode)) {
    return [nestedEditor, ""];
  }

  editor.update(
    () => {
      const writable = widgetNode!.getWritable();

      writable.editor = nestedEditor;

      // Save parent editor reference for later use to generate and store editor state
      // after all nested widgets are processed.
      writable.parentEditor = editor;

      // Cache the variant defs so processWidgetSync can apply defaults without an async fetch.
      $storeCacheData({
        [getWidgetVariantDefsCacheKey(widgetNode!.slug)]: widgetVariantDefs,
      });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return [nestedEditor, htmlString];
};

export const getWidgetNestedEditorCacheKey = (widgetSlug: string) => {
  return `widget_${widgetSlug}_nested_editor`;
};

export const getWidgetEditorStateCacheKey = (widgetSlug: string) => {
  return `widget_${widgetSlug}_editor_state`;
};

export const getWidgetVariantDefsCacheKey = (widgetSlug: string) => {
  return `widget_${widgetSlug}_variant_defs`;
};

export const storeWidgetEditorStateInCache = (
  editor: LexicalEditor,
  widgetSlug: string,
  editorState: string
) => {
  editor.update(
    () => {
      $storeCacheData({
        [getWidgetEditorStateCacheKey(widgetSlug)]: editorState,
      });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const getWidgetEditorStateFromCache = (
  editor: LexicalEditor,
  widgetSlug: string
): string | undefined => {
  return editor.read(() =>
    $getCacheData<string>(getWidgetEditorStateCacheKey(widgetSlug))
  );
};

/**
 * Updates the widget global cache with data fetching node data and pagination.
 * This is a helper function to avoid code duplication when updating the global cache.
 *
 * @param dataName - The name of the data fetching node
 * @param data - The fetched data to store
 * @param pagination - Optional pagination information to store
 */
export const BEFORE_PROCESS_ALL_WIDGET = createCommand<{ index: number }>();

export const END_PROCESS_ALL_WIDGET = createCommand<{
  index: number;
  editor: LexicalEditor;
  nestedEditors: LexicalEditor[];
}>();

export const PROCESS_ALL_WIDGET = createCommand<{
  index: number;
  nestedEditor: LexicalEditor;
}>();

const getAllWidgetNodes = (parentEditor: LexicalEditor): WidgetNode[] => {
  const allWidgetNodes: WidgetNode[] = [];

  parentEditor.read(() => {
    $walkNode($getRoot(), (node) => {
      if ($isWidgetNode(node)) {
        allWidgetNodes.push(node);
        const nestedEditor = node.editor;
        if (!nestedEditor) {
          return [];
        }

        // Also walk nested widget nodes in the nested editors
        const widgetNodes = getAllWidgetNodes(nestedEditor);
        for (const nestedNode of widgetNodes) {
          allWidgetNodes.push(nestedNode);
        }
      }
    });
  });

  return allWidgetNodes;
};

export const processAllWidgets = async (
  editor: LexicalEditor,
  options?: {
    callback?: (args: {
      editor: LexicalEditor;
      nestedEditors: LexicalEditor[];
    }) => Promise<void>;
    preload?: Pick<types.PreloadedTemplateMapping, "widgetEditorState">;
  }
): Promise<boolean> => {
  const { callback, preload } = options || {};
  const index = Math.floor(Math.random() * 1000000);
  const allNestedEditors: LexicalEditor[] = [];

  const innerFn = async (
    innerEditor: LexicalEditor,
    currentPreload?: Pick<types.PreloadedTemplateMapping, "widgetEditorState">
  ) => {
    const widgetNodes: WidgetNode[] = [];
    const nestedEditors: LexicalEditor[] = [];

    // Get all widget nodes in the editor
    innerEditor.read(() => {
      $walkNode($getRoot(), (node) => {
        if (!$isWidgetNode(node)) {
          return;
        }

        widgetNodes.push(node);
      });
    });

    // Process each widget node
    for (const widgetNode of widgetNodes) {
      await processWidget({
        nodeKey: widgetNode.getKey(),
        editor: innerEditor,
      }).then(([nestedEditor]) => {
        // Collect nested editors to process later
        nestedEditors.push(nestedEditor);
        allNestedEditors.push(nestedEditor);
      });
    }

    // Merge current level data with existing preload data
    // Current level data takes precedence as it's more specific to this context
    const mergedPreload: Pick<
      types.PreloadedTemplateMapping,
      "widgetEditorState"
    > = {
      widgetEditorState: currentPreload?.widgetEditorState || {}, // Default to empty object if no preload provided
    };

    // Recursively process nested editors with accumulated data
    for (const nestedEditor of nestedEditors) {
      await innerFn(nestedEditor, mergedPreload);
      editor.dispatchCommand(PROCESS_ALL_WIDGET, {
        index,
        nestedEditor,
      });
    }

    return true;
  };

  editor.dispatchCommand(BEFORE_PROCESS_ALL_WIDGET, { index });
  const result = await innerFn(editor, preload);

  if (callback) {
    await callback({
      editor,
      nestedEditors: allNestedEditors,
    });
  }

  // Update all widget innerHTML directly before notifying observers
  // This replaces the unpredictable registerNodeTransform pattern with explicit, synchronous updates
  editor.update(
    () => {
      $walkNode($getRoot(), (node) => {
        if ($isWidgetNode(node)) {
          const writable = node.getWritable();
          const htmlString = writable.generateHtmlString();
          writable.innerHTML = htmlString;
        }
      });
    },
    { discrete: true, tag: HISTORY_MERGE_TAG }
  );

  editor.dispatchCommand(END_PROCESS_ALL_WIDGET, {
    index,
    editor,
    nestedEditors: allNestedEditors,
  });

  // COMMENTED OUT: Old transform-based approach (causes race conditions with React decorators)
  // const removeTransform = editor.registerNodeTransform(
  //   WidgetNode,
  //   (widgetNode) => {
  //     console.trace(
  //       "processAllWidgets: Updating WidgetNode HTML for slug:",
  //       widgetNode.slug
  //     );
  //     const htmlString = widgetNode.generateHtmlString();
  //     widgetNode.innerHTML = htmlString;
  //   }
  // );

  // Now that all nested widgets are processed, collect and cache their editor states:
  // 1. Get all widget nodes from the root editor (including deeply nested ones)
  // 2. Process them in reverse order (most nested first, bubbling up to parents)
  //    - This ensures parent widgets capture the latest state of their nested widgets
  // 3. For each widget node, extract the editor state from its nested editor
  // 4. Store the editor state in the root editor cache for global access
  //    - Cache key format: widget_{slug}_editor_state
  // 5. Collect all nested cache data for global storage later
  const widgetNodes = getAllWidgetNodes(editor);

  const widgetEditorStates: Record<string, string> = {};
  let nestedCacheDataMapping: Record<string, any> = {};

  // Important: Process in reverse order (deepest nesting first, then bubble up)
  // Why reverse? getAllWidgetNodes returns nodes in depth-first order (parents before children).
  // By reversing, we process children first, so when we get to parent widgets, their nested
  // editors already have up-to-date editor states cached. This allows parent widgets to
  // capture and include the complete, final state of all their nested widgets in their own
  // editor state, maintaining the proper hierarchy of widget data.
  for (const widgetNode of widgetNodes.reverse()) {
    const parentEditor = widgetNode.parentEditor;
    if (!parentEditor) {
      continue;
    }

    parentEditor.update(
      () => {
        const writable = widgetNode.getWritable();

        // Get the editor state in JSON format and convert to string
        const editorState = JSON.stringify(
          writable.editor?.getEditorState().toJSON()
        );

        // Cache key for this widget's editor state
        const editorStateCacheKey = getWidgetEditorStateCacheKey(
          widgetNode.slug
        );

        // Store the editor state of the most nested editor
        widgetEditorStates[editorStateCacheKey] = editorState;
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    // Collect all cache data from this widget's nested editor for global storage later
    // Order matters: Process widgets in reverse (children first), so earlier iterations contain
    // deeper nested data. By spreading nestedCacheDataMapping first, then nestedCacheData,
    // we ensure that parent widget cache data overwrites child data when keys conflict.
    // This maintains the precedence: shallower widgets > deeper widgets.
    const nestedEditor = widgetNode.editor;
    if (nestedEditor) {
      const nestedCacheData = nestedEditor.read(() => $getAllCacheData());
      nestedCacheDataMapping = {
        ...nestedCacheDataMapping, // Existing data from previously processed (deeper) widgets
        ...nestedCacheData, // Current widget's cache (overwrites if keys conflict)
      };
    }
  }

  // Store all widget editor states and cache data in the root editor for global access.
  // This data will be inherited by nested widgets during processWidgetSync, ensuring they
  // have access to both their own cached data and data from other widgets in the tree.
  //
  // NOTE: We use $storeCacheData directly here instead of $storeWidgetGlobalCache because:
  // 1. We're building the complete cache structure from scratch with 3 distinct layers
  // 2. $storeWidgetGlobalCache is designed for incremental updates to data fetching nodes only
  // 3. This operation merges nested cache data, current editor cache, and widget editor states
  // 4. Using $storeWidgetGlobalCache would only handle data-fetching-node-* keys, not the full cache
  editor.update(
    () => {
      $storeCacheData({
        widget_global_cached_data: {
          // Layer 1: Nested cache data from all child widgets (collected during reverse iteration)
          ...nestedCacheDataMapping,

          // Layer 2: Current editor's own cache data (overwrites nested data if keys conflict)
          // This ensures parent/root editor data takes precedence over nested widget data
          ...$getAllCacheData(),

          // Layer 3: Individual widget editor states (final layer, highest precedence)
          // These are the serialized editor states for each widget (key: widget_{slug}_editor_state)
          ...widgetEditorStates,
        },
      });

      // Also store individual widget editor states directly in the root cache for quick access
      // This allows widgets to retrieve their editor state without accessing widget_global_cached_data
      $storeCacheData(widgetEditorStates);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return result;
};

export const processWidgetSync = (args: {
  nodeKey: string;
  editor: LexicalEditor;
}): [LexicalEditor, string] => {
  const { nodeKey, editor } = args;

  const nestedEditor = createNestedEditor(editor);

  let widgetNode: WidgetNode | null = editor.read(() => $getNodeByKey(nodeKey));

  if (!widgetNode || !$isWidgetNode(widgetNode)) {
    return [nestedEditor, ""];
  }

  const nodeSlug = widgetNode.slug;

  let editorState = editor.read(() =>
    $getCacheData<string>(getWidgetEditorStateCacheKey(nodeSlug))
  );

  // Get all cache data from parent editor
  const widgetGlobalCacheData =
    editor.read(() => $getCacheData("widget_global_cached_data")) || {};

  // This should not happen in sync version
  if (!editorState || 0 >= editorState.length) {
    logger.warn(
      "Widget editor state not found in cache for widget slug:",
      widgetNode.slug
    );

    // Fallback to default empty content.
    // In sync version, we don't fetch from server.
    editorState = DEFAULT_TEMPLATE_JSON_STRING_CONTENT;
  }

  // Compute context data on-demand from parent CollectionElementNode
  const collectionElementData = editor.read(() =>
    $deferredGetCollectionElementData(widgetNode)
  );

  // Read variant defs cached by processWidget's async pass so defaults can be
  // applied without a server fetch.
  const widgetVariantDefs =
    editor.read(() =>
      $getCacheData<types.WidgetVariants>(
        getWidgetVariantDefsCacheKey(nodeSlug)
      )
    ) ?? {};

  nestedEditor.update(
    () => {
      $storeCacheData(widgetGlobalCacheData);

      if (collectionElementData) {
        // Store collection element data specifically as well to cache as data fetching nodes rely on these keys
        for (const [key, value] of Object.entries(collectionElementData)) {
          logger.log( `Storing mergedDataMapping: key=${key}, value=`, value);
          $storeFetchedData(key, value);
        }
      }

      // Build variant data by merging template defaults with node-specific values.
      // Must be stored here — parseJsonStringSyncLocal snapshots the cache before
      // resetting the editor state, so values stored in this update block are
      // captured and restored around the state reset.
      const variantDefaults: Record<string, string | number | boolean> = {};
      for (const [varName, [, defVal]] of Object.entries(widgetVariantDefs)) {
        if (defVal !== null) variantDefaults[varName] = defVal;
      }
      const variantData = {
        ...variantDefaults,
        ...(widgetNode?.widgetVariantValues ?? {}),
      };
      if (Object.keys(variantData).length > 0) {
        $storeFetchedData("%variant", variantData);
      }
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  const newEditorState = parseJsonStringSyncLocal(nestedEditor, editorState);

  const htmlString = nestedEditor
    //.getEditorState()
    .read(() => $generateHtmlFromNodes(nestedEditor, null));

  // Get the node again since the editor has been updated
  widgetNode = editor.read(() => $getNodeByKey(nodeKey));
  if (!widgetNode || !$isWidgetNode(widgetNode)) {
    return [nestedEditor, ""];
  }

  editor.update(
    () => {
      const writable = widgetNode.getWritable();

      writable.editor = nestedEditor;
      writable.parentEditor = editor;

      $storeCacheData({
        [getWidgetEditorStateCacheKey(widgetNode.slug)]: JSON.stringify(
          newEditorState.toJSON()
        ),
      });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return [nestedEditor, htmlString];
};

export const $processAllWidgetsSync = (
  callback?: (editor: LexicalEditor) => void
) => {
  const editor = $getEditor();

  // Check if there's any widget node in the current editor
  let hasWidgetNode = false;
  $walkNode($getRoot(), (node) => {
    if ($isWidgetNode(node)) {
      hasWidgetNode = true;
      return true;
    }
    return false;
  });

  if (!hasWidgetNode) {
    logger.log( "$processAllWidgetsSync: No widget nodes found.");
    setTimeout(() => {
      callback?.(editor);
    });
    return;
  }

  // Need to call asynchronously as it involves multiple editor reads/writes.
  setTimeout(() => {
    processAllWidgetsSync(editor);
    callback?.(editor);
  });
};

export const processAllWidgetsSync = (editor: LexicalEditor): boolean => {
  const index = Math.floor(Math.random() * 1000000);
  const allNestedEditors: LexicalEditor[] = [];

  const innerFn = (innerEditor: LexicalEditor) => {
    const widgetNodes: WidgetNode[] = [];
    const nestedEditors: LexicalEditor[] = [];

    // Get all widget nodes in the editor
    innerEditor.read(() => {
      $walkNode($getRoot(), (node) => {
        if (!$isWidgetNode(node)) {
          return;
        }

        widgetNodes.push(node);
      });
    });

    // Process each widget node synchronously
    for (const widgetNode of widgetNodes) {
      const [nestedEditor] = processWidgetSync({
        nodeKey: widgetNode.getKey(),
        editor: innerEditor,
      });

      // Collect nested editors to process later
      nestedEditors.push(nestedEditor);
      allNestedEditors.push(nestedEditor);
    }

    // Recursively process nested editors with accumulated data
    for (const nestedEditor of nestedEditors) {
      innerFn(nestedEditor); //, mergedPreload);
      editor.dispatchCommand(PROCESS_ALL_WIDGET, {
        index,
        nestedEditor,
      });
    }

    return true;
  };

  editor.dispatchCommand(BEFORE_PROCESS_ALL_WIDGET, { index });
  const result = innerFn(editor); //, preload);

  // Update all widget innerHTML directly before notifying observers
  // This replaces the unpredictable registerNodeTransform pattern with explicit, synchronous updates
  editor.update(
    () => {
      $walkNode($getRoot(), (node) => {
        if ($isWidgetNode(node)) {
          const writable = node.getWritable();
          const htmlString = writable.generateHtmlString();
          writable.innerHTML = htmlString;
        }
      });
    },
    { discrete: true, tag: HISTORY_MERGE_TAG }
  );

  editor.dispatchCommand(END_PROCESS_ALL_WIDGET, {
    index,
    editor,
    nestedEditors: allNestedEditors,
  });

  // COMMENTED OUT: Old transform-based approach (causes race conditions with React decorators)
  // const removeTransform = editor.registerNodeTransform(
  //   WidgetNode,
  //   (widgetNode) => {
  //     const htmlString = widgetNode.generateHtmlString();
  //     widgetNode.innerHTML = htmlString;
  //   }
  // );

  return result;
};

export const getWidgetEditorStateCacheData = (editor: LexicalEditor) => {
  const currentCacheData = editor.read(() => $getAllCacheData());

  // widget_-slug-_editor_state
  let widgetEditoStateCache: Record<string, any> | undefined = undefined;
  if (currentCacheData) {
    for (const key in currentCacheData) {
      if (key.startsWith("widget_") && key.endsWith("_editor_state")) {
        if (!widgetEditoStateCache) {
          widgetEditoStateCache = {};
        }
        widgetEditoStateCache[key] = currentCacheData[key];
      }
    }
  }

  return widgetEditoStateCache;
};

export const getGZipWidgetEditorStateCacheData = async (
  editor: LexicalEditor
): Promise<string | undefined> => {
  const widgetEditorStateCache = getWidgetEditorStateCacheData(editor);
  if (!widgetEditorStateCache) {
    return undefined;
  }
  return await gzipJSON(widgetEditorStateCache);
};

export const getGZipEditorState = async (
  editor: LexicalEditor
): Promise<string | undefined> => {
  const editorStateString = JSON.stringify(editor.getEditorState().toJSON());
  if (!editorStateString) {
    return undefined;
  }
  return await gzipString(editorStateString);
};

// export const $updateWidgetInnerHTML = (
//   //editor: LexicalEditor,
//   widgetNode: WidgetNode,
//   targetElement: Element | Document
// ) => {
//   // Check if there are any rendered React decorator elements that need to be preserved
//   // These elements have the data-decorator-id attribute and may contain React-rendered content
//   const editorClassName = widgetNode.__css.getEditorClassName();
//   if (!editorClassName) {
//     return;
//   }

//   // Get the widget element in the iframe document
//   const widgetElement = targetElement.querySelector<HTMLElement>(
//     `.${editorClassName}`
//   );

//   // Then update widgetNode innerHTML with preserved decorator elements
//   if (widgetElement) {
//     const writable = widgetNode.getWritable() as WidgetNode;
//     writable.innerHTML = widgetElement.innerHTML;

//     // Increment htmlIncrementalId to signal that innerHTML was updated programmatically.
//     // This prevents updateDOM from overwriting the DOM with stale innerHTML, ensuring that
//     // React-rendered decorator elements are preserved in the widget's HTML content.
//     writable.htmlIncrementalId++;
//   }
// };
