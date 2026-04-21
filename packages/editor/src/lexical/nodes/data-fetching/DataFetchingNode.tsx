import {
  $getEditor,
  $getRoot,
  DecoratorNode,
  EditorConfig,
  HISTORY_MERGE_TAG,
  Klass,
  LexicalEditor,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { JSX } from "react";
import { z } from "zod";

import { getKlassNodes } from "../../klass-registry";
import {
  deferredFindDataFetchingNodeByCollectionName,
  deferredWalkNodeWithWidgets,
} from "../../deferred";
import { $walkNode } from "../../walk-node";
import {
  $getAllCacheData,
  $getAllQueryCache,
  $getAllURLQueryCache,
  $getAllURLQueryCacheByName,
  $getCacheData,
  $storeCacheData,
  getAllQueryCache,
  getCacheData,
} from "../cache/CacheNode";
import { createVoidElement } from "../wp/create-void-element";
import { DATA_FETCHING_NODE_FETCHED_COMMAND } from "./commands";

import type * as types from "../../../types";
import { logger } from "../../logger";

export type SerializedDataFetchingNode = Spread<
  {
    name: string;
    ID: number;
    query: any | undefined;
    options: Record<string, any> | undefined;
    allowedQueryPassthroughKeys: string[];
  },
  SerializedLexicalNode
>;

export type DataFetchingPagination = {
  page: number;
  limit: number;
  totalPage: number;
  count: number;
};

// Zod validator for DataFetchingPagination.
// Used to parse and validate pagination data returned by fetch methods,
// and to derive key types for dynamic attribute condition operators.
export const dataFetchingPaginationValidator = z.object({
  page: z.number(),
  limit: z.number(),
  totalPage: z.number(),
  count: z.number(),
});

export const DATA_CACHE_PREFIX = "data-fetching-node-";

export type DataFetchingQuery<T extends DataFetchingNode> = T["__query"];

export class DataFetchingNode<
  Q extends Record<string, any> | Array<Record<string, any>> = Record<
    string,
    any
  >,
  D = any,
> extends DecoratorNode<null> {
  #name: string = "";
  ID: number;
  __query: Q | undefined;
  __data: D | undefined;
  __options: Record<string, any> | undefined;
  __pagination?: DataFetchingPagination;

  // Whether it has pagination or not.
  __hasPagination: boolean = false;

  // Keys that are allowed to be passed through from URL query parameters to the data fetching node's query.
  __allowedQueryPassthroughKeys: string[] = [];

  // Used to determine if the node should be hidden from left panel
  __hidden: boolean = false;

  constructor(key?: string) {
    super(key);
    this.#name = this.getDefaultName();
    this.ID = Math.floor(Math.random() * 100000);
  }

  getDefaultName() {
    return `name-${Math.floor(Math.random() * 100)}`;
  }

  static getValidator(): z.ZodObject<any, any> | z.ZodArray<any> {
    return z.object({});
  }

  // Returns the Zod validator for pagination data.
  // Subclasses with __hasPagination = true use this to parse and validate
  // the pagination object returned by their fetch method.
  static getPaginationValidator() {
    return dataFetchingPaginationValidator;
  }

  static getType(): string {
    //throw new Error("Method not implemented.");
    return "*-data";
  }

  getName() {
    return this.#name.trim();
  }

  setName(name: string) {
    this.#name = name.trim();
  }

  getQuery(): Q {
    return this.__query ?? ({} as Q);
  }

  setAllowedQueryPassthroughKeys(keys: string[]) {
    this.__allowedQueryPassthroughKeys = keys;
  }

  getAllowedQueryPassthroughKeys() {
    return this.__allowedQueryPassthroughKeys;
  }

  // Use setURLQuery instead of setQuery when handling URL query parameters to ensure security.
  // setURLQuery filters parameters through allowedQueryPassthroughKeys to prevent unauthorized
  // query injection, whereas setQuery directly replaces the entire query without any filtering.
  // This is critical for URL-based queries where user input should be restricted to allowed keys only.
  setURLQuery(query: types.URLQueryCacheData) {
    const targetQuery = query?.[this.getName()];
    if (!targetQuery) {
      logger.log(
        "DataFetchingNode: No query found in URL query cache for",
        this.getName()
      );
      return;
    }

    const allowedKeys = this.__allowedQueryPassthroughKeys;

    const newQuery: Record<string, any> = this.__query
      ? { ...this.__query }
      : {};

    for (const key of allowedKeys) {
      if (key in targetQuery) {
        newQuery[key] = targetQuery[key];
      }
    }

    this.__query = {
      ...(this.__query as Record<string, any>),
      ...newQuery,
    } as Q;
  }

  setQuery(query: Q) {
    this.__query = {
      ...this.__query,
      ...query,
    } as Q;
  }

  getOptions(): Record<string, any> {
    return this.__options ?? {};
  }

  setOptions(options: Record<string, any>) {
    this.__options = options;
  }

  setData(data?: D) {
    this.__data = data;
  }

  setPagination(pagination?: DataFetchingPagination) {
    this.__pagination = pagination;
  }

  getPagination() {
    return this.__pagination;
  }

  getData() {
    // If data is not set in the node, try to get from cache
    return this.__data || $getFetchedData(this);
  }

  static clone(node: DataFetchingNode): DataFetchingNode {
    const newNode = new DataFetchingNode(node.__key);
    newNode.afterClone(node);

    return newNode;
  }

  createDOM(): HTMLElement {
    const element = createVoidElement();
    return element;
  }

  updateDOM(
    prevNode: DataFetchingNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return true;
  }

  // Don't directly call this method. Use fetchDataFetchingNode() instead,
  // since it triggers editor commands to notify data changes.
  async fetch(
    serverActions: types.DataServerActions,
    editor: LexicalEditor
  ): Promise<[any, DataFetchingPagination] | [any]> {
    throw new Error("Method not implemented.");
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }

  // Called after importJSON
  afterImportJSON(serializedNode: SerializedDataFetchingNode) {
    this.#name = serializedNode.name ?? this.getDefaultName();
    this.__query = serializedNode.query;
    this.__options = serializedNode.options;
    this.ID = serializedNode.ID;
    this.__allowedQueryPassthroughKeys =
      serializedNode.allowedQueryPassthroughKeys || [];
  }

  // Call after cloned
  afterClone(node: DataFetchingNode) {
    this.#name = node.#name;
    this.__query = node.__query as Q;
    this.__options = node.__options;
    this.__data = node.__data;
    this.__allowedQueryPassthroughKeys = node.__allowedQueryPassthroughKeys;
    this.ID = node.ID;

    // Store in cache without calling getWritable() to avoid infinite clone loop
    const cacheKey = getCacheKeyForDataFetchingNode(this); //`data-fetching-node-${this.getName()}`;
    $storeCacheData({ [cacheKey]: node.getData() });
  }

  // Should never be called directly. Use afterImportJSON instead.
  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): DataFetchingNode {
    const node = new DataFetchingNode((serializedNode as any).__key);
    node.#name = serializedNode.name ?? node.getDefaultName();
    node.__query = serializedNode.query;
    node.__options = serializedNode.options;
    node.ID = serializedNode.ID;
    node.__allowedQueryPassthroughKeys =
      serializedNode.allowedQueryPassthroughKeys || [];
    return node;
  }

  exportJSON(): SerializedDataFetchingNode {
    return {
      //...super.exportJSON(),
      type: this.getType(),
      name: this.#name ?? this.getDefaultName(),
      ID: this.ID,
      query: this.__query,
      options: this.__options,
      allowedQueryPassthroughKeys: this.__allowedQueryPassthroughKeys,
      version: 1,
    };
  }
}

export const DataDecorator = (props: { node: DataFetchingNode }) => {
  const { node } = props;
  //const [editor] = useLexicalComposerContext();
  //const serverActions = useServerActions();

  return <></>;
};

export const $createDataFetchingNode = <
  T extends Record<string, any> = Record<string, any>,
>(
  clazz: typeof DataFetchingNode,
  args?: Partial<{ query: T; options: Record<string, any> }>
) => {
  const node = new clazz();
  node.__query = args?.query;
  node.__options = args?.options;

  return node;
};

export const $isDataFetchingNode = (node: any): node is DataFetchingNode => {
  return node instanceof DataFetchingNode || node?.getType()?.endsWith("data");
};

export const $getDataKlassNodes = () => {
  return getKlassNodes().filter((klass) => $isDataFetchingNode(klass));
};

export const $getDataKlassNodeByType = <T extends typeof DataFetchingNode>(
  type: string
) => {
  const klassNodes = $getDataKlassNodes();
  const klassNode = klassNodes.find((klass) => klass.getType() === type);

  return !klassNode ? null : (klassNode as unknown as T);
};

export const $getDataFetchingNodeByType = (type: string) => {
  const klassNode = $getDataKlassNodeByType(type);

  if (!klassNode) {
    throw new Error(`Unknown node type: ${type}`);
  }

  return $createDataFetchingNode(klassNode, {}) as DataFetchingNode;
};

export const $getDataFetchingNodeByName = (name: string) => {
  const dataNode = $getRoot()
    .getChildren()
    .filter($isDataFetchingNode)
    .find((node) => node.getName() === name);

  if (!dataNode) {
    return undefined;
  }

  return dataNode;
};

// TODO: should be deprecated. Throw error if duplicate names are found.
// When so, notify user to rename the nodes.
export const $getDataPrefixName = (targetNode: DataFetchingNode) => {
  let prefix = targetNode.getType().split("-")[0];
  let index = 0;

  // Check if the same data node already exists.
  // If so, add a number to the end of the name.
  $walkNode($getRoot(), (node) => {
    if (!$isDataFetchingNode(node)) {
      return;
    }

    if (
      node.getKey() !== targetNode.getKey() &&
      node.getType() == targetNode.getType()
    ) {
      index = index == 0 ? 2 : index + 1;
    }
  });

  return index > 0 ? `${prefix}-${index}` : prefix;
};

const getCacheKeyForDataFetchingNode = (node: DataFetchingNode) => {
  return `${DATA_CACHE_PREFIX}${node.getName()}`;
};

/**
 * Generates the cache key for a data fetching node by name.
 * @param nodeName - The name of the data fetching node
 * @returns The cache key in the format "data-fetching-node-{nodeName}"
 */
export const getDataFetchingCacheKey = (nodeName: string) => {
  return `${DATA_CACHE_PREFIX}${nodeName}`;
};

/**
 * Generates the pagination cache key for a data fetching node by name.
 * @param nodeName - The name of the data fetching node
 * @returns The pagination cache key in the format "data-fetching-node-{nodeName}-pagination"
 */
export const getDataFetchingPaginationCacheKey = (nodeName: string) => {
  return `${DATA_CACHE_PREFIX}${nodeName}-pagination`;
};

export const $storeWidgetGlobalCache = (
  dataName: string,
  data: any,
  pagination?: any
) => {
  const { widget_global_cached_data: widgetGlobalCache } =
    $getAllCacheData() || {};

  const newWidgetGlobalCache = {
    ...widgetGlobalCache,
    [getDataFetchingCacheKey(dataName)]: data,
    ...(pagination && {
      [getDataFetchingPaginationCacheKey(dataName)]: pagination,
    }),
  };

  // Remove widget_global_cached_data from newWidgetGlobalCache to avoid nesting
  if (newWidgetGlobalCache.widget_global_cached_data) {
    delete newWidgetGlobalCache.widget_global_cached_data;
  }

  return $storeCacheData({
    widget_global_cached_data: newWidgetGlobalCache,
  });
};

export const $storeFetchedData = (
  nodeOrString: DataFetchingNode | string | null | undefined,
  data: any,
  pagination?: DataFetchingPagination
) => {
  if (!nodeOrString) {
    return false;
  }

  let ok = false;

  // If string, store in cache directly.
  // i.e. there's no DataFetchingNode instance available in the current editor state.
  // but there's a need to store the fetched data in downstream processing (e.g. WidgetNode).
  // In that case, we just store in the cache with the given name.
  if (typeof nodeOrString === "string") {
    const cacheKey = `${DATA_CACHE_PREFIX}${nodeOrString}`;
    const cacheKeyPagination = `${cacheKey}-pagination`;
    ok =
      $storeCacheData({ [cacheKey]: data }) &&
      (!pagination
        ? true
        : $storeCacheData({ [cacheKeyPagination]: pagination }));

    // Also make sure to store in the global widget cache
    //ok = ok && $storeWidgetGlobalCache(nodeOrString, data, pagination);
    return ok;
  }

  const cacheKey = getCacheKeyForDataFetchingNode(nodeOrString);
  ok =
    $storeCacheData({ [cacheKey]: data }) &&
    (!pagination
      ? true
      : $storeCacheData({ [`${cacheKey}-pagination`]: pagination }));

  // Store in the global widget cache as well
  //ok = ok && $storeWidgetGlobalCache(nodeOrString.getName(), data, pagination);

  if (ok) {
    // Also store in the node itself
    const writable = nodeOrString.getWritable();
    writable.setData(data);
    writable.setPagination(pagination);
  }
  return ok;
};

export const $getFetchedData = <T = any,>(
  nodeOrString: DataFetchingNode | string
): T | undefined => {
  if (typeof nodeOrString === "string") {
    return getCacheData<T>($getEditor(), `${DATA_CACHE_PREFIX}${nodeOrString}`);
  }

  if (!$isDataFetchingNode(nodeOrString)) {
    return undefined;
  }

  const cacheKey = getCacheKeyForDataFetchingNode(nodeOrString);
  return getCacheData<T>($getEditor(), cacheKey);
};

export const $getFetchedPagination = (
  nodeOrString: DataFetchingNode | string
): DataFetchingPagination | undefined => {
  if (typeof nodeOrString === "string") {
    return getCacheData<DataFetchingPagination>(
      $getEditor(),
      `${DATA_CACHE_PREFIX}${nodeOrString}-pagination`
    );
  }

  if (!$isDataFetchingNode(nodeOrString)) {
    return undefined;
  }

  const cacheKey = getCacheKeyForDataFetchingNode(nodeOrString);
  return getCacheData<DataFetchingPagination>(
    $getEditor(),
    `${cacheKey}-pagination`
  );
};

export const getFetchedData = <T = any,>(
  editor: LexicalEditor,
  nodeOrString: DataFetchingNode | string
): T | undefined => {
  return editor.read(() => {
    return $getFetchedData<T>(nodeOrString);
  });
};

export const getFetchedPagination = (
  editor: LexicalEditor,
  nodeOrString: DataFetchingNode | string
): DataFetchingPagination | undefined => {
  return editor.read(() => {
    return $getFetchedPagination(nodeOrString);
  });
};

export const fetchDataFetchingNode = async <T = any, U = any>(
  node: DataFetchingNode,
  editor: LexicalEditor,
  serverActions: types.DataServerActions,
  options?: { useCacheIfExists?: boolean }
): Promise<[T, U]> => {
  //new Promise<[T, U]>((resolve) => {
  const useCacheIfExists = options?.useCacheIfExists ?? true;

  // Check if data is cached
  const cachedData = getFetchedData(editor, node);
  const cachedPagination = getFetchedPagination(editor, node);
  if (cachedData && useCacheIfExists) {
    // Use cached data
    //resolve([cachedData, cachedPagination] as [T, U]);
    return [cachedData, cachedPagination] as [T, U];
  }

  const [data, pagination] = await node.fetch(serverActions, editor);

  editor.update(
    () => {
      const cacheName = node.getName();

      // Get the writable node by name.
      // This is necessary because the node might have been re-created
      const writable = $getDataFetchingNodeByName(cacheName)?.getWritable();

      $storeFetchedData(writable, data, pagination);

      // And store widget global cache as well
      $storeWidgetGlobalCache(cacheName, data, pagination);

      node = writable || node;
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  editor.dispatchCommand(DATA_FETCHING_NODE_FETCHED_COMMAND, {
    node,
  });

  return [data as T, pagination as U];
};

export const fetchAllDataFetchingNodes = async (
  editor: LexicalEditor,
  serverActions: types.DataServerActions
): Promise<types.FetchedDataMapping> => {
  const dataNodes = editor
    .getEditorState()
    .read(() => $getRoot().getChildren().filter($isDataFetchingNode));

  let fetchedDataMapping: types.FetchedDataMapping = {};

  for (const node of dataNodes) {
    // Check if data is already cached
    const cacheData = editor.read(() => $getFetchedData<any>(node.getName()));

    // Use cached data if exists
    if (cacheData) {
      fetchedDataMapping = {
        ...fetchedDataMapping,
        [node.getName()]: cacheData,
      };
      // editor.update(
      //   () => {
      //     $storeFetchedData(node, cacheData);
      //   },
      //   {
      //     discrete: true,
      //   }
      // );
      continue;
    }

    // IMPORTANT: Final step in URL query parameter propagation chain
    //
    // Query cache flows through the editor hierarchy:
    // 1. WPPage (root editor): Initializes query cache from URL parameters (e.g., ?page=2&limit=10)
    // 2. WidgetNode (nested editor): Propagates query cache from parent to nested widget editors
    // 3. DataFetchingNode (HERE): Reads query cache and securely merges into node's query data
    //
    // Why we use setURLQuery instead of setQuery:
    // - setURLQuery filters through allowedQueryPassthroughKeys to prevent query injection attacks
    // - Only explicitly allowed keys (defined per node) are merged from URL parameters
    // - Protects against malicious URL parameters affecting unintended query fields
    //
    // This enables safe dynamic data fetching based on URL params for pagination, filtering, search, etc.
    const urlQueryCache = editor.read(() => $getAllURLQueryCache());

    // Merge URL query parameters into the node's query before fetching data
    if (Object.keys(urlQueryCache).length > 0) {
      editor.update(
        () => {
          const writable = node.getWritable();

          // Use setURLQuery (not setQuery) to securely filter and merge only allowed query parameters
          writable.setURLQuery(urlQueryCache);
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    // data doesn't exist in cache, so fetch it from the backend
    const [fetchedData] = await fetchDataFetchingNode(
      editor.read(() => node.getLatest()),
      editor,
      serverActions
    );
    fetchedDataMapping = {
      ...fetchedDataMapping,
      [node.getName()]: fetchedData,
    };
  }

  return fetchedDataMapping;
};

/**
 * Returns the URL query cache entries for the DataFetchingNode that backs a given collection.
 *
 * Resolves the collection name → DataFetchingNode name, then reads `__url_query[name]`
 * from the cache. This is the same data that `fetchAllDataFetchingNodes` merges into
 * the node's query from URL params (e.g. ?search=foo&page=2).
 *
 * Returns `null` when no DataFetchingNode is linked to the collection, or when there
 * is no URL query cache entry for it.
 */
export const getURLQueryCacheByCollection = (
  editor: LexicalEditor,
  collectionName: string
): Record<string, any> | null => {
  const result = deferredFindDataFetchingNodeByCollectionName(
    editor,
    collectionName
  );

  if (!result) {
    return null;
  }

  const [dataFetchingNode, nodeEditor] = result;
  const dataFetchingName = nodeEditor.read(() => dataFetchingNode.getName());

  if (!dataFetchingName) {
    return null;
  }

  return (
    editor.read(() => $getAllURLQueryCacheByName(dataFetchingName)) ?? null
  );
};

/**
 * Finds a DataFetchingNode by its own name (getName()) across the full editor tree,
 * including nodes nested inside widget editors.
 *
 * Unlike $getDataFetchingNodeByName, which only searches root-level children,
 * this function traverses all widget sub-editors as well.
 *
 * @param editor - The root LexicalEditor instance to search from
 * @param dataFetchingName - The name returned by DataFetchingNode.getName()
 * @returns A tuple of [DataFetchingNode, LexicalEditor] if found, or null if not found.
 *          The returned editor is where the node lives (may differ from root if inside a widget).
 */
export const findDataFetchingNodeByName = (
  editor: LexicalEditor,
  dataFetchingName: string
): [DataFetchingNode, LexicalEditor] | null => {
  let found = false;
  let currentEditor = editor;
  let result: DataFetchingNode | null = null;

  deferredWalkNodeWithWidgets(editor, (walkedEditor, node) => {
    if (found) return;

    walkedEditor.read(() => {
      if ($isDataFetchingNode(node) && node.getName() === dataFetchingName) {
        result = node;
        currentEditor = walkedEditor;
        found = true;
      }
    });
  });

  return result ? [result satisfies DataFetchingNode, currentEditor] : null;
};
