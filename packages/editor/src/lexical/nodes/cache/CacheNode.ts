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
import { $walkNode } from "../../walk-node";
import type * as types from "../../../types";
import { createVoidElement } from "../wp/create-void-element";
import { logger } from "../../logger";

export type CacheData = Record<string, any>;

export type SerializedCacheNode = Spread<
  {
    // __data: CacheData;
  },
  SerializedLexicalNode
>;

export class CacheNode extends DecoratorNode<null> {
  __data: CacheData | undefined;

  constructor(key?: string, data?: CacheData) {
    super(key);
    this.__data = data;
  }

  static getType(): string {
    return "cache";
  }

  static clone(node: CacheNode): CacheNode {
    return new CacheNode(node.__key, node.__data);
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }

  isEmpty(): boolean {
    return !this.__data || Object.keys(this.__data).length === 0;
  }

  setData(data: CacheData) {
    this.__data = {
      ...this.__data,
      ...data,
    };
  }

  getData(key: string) {
    return this.__data ? this.__data[key] : undefined;
  }

  removeData(key: string) {
    if (this.__data && key in this.__data) {
      delete this.__data[key];
    }
  }

  createDOM(): HTMLElement {
    const element = createVoidElement();
    return element;
  }

  updateDOM(
    prevNode: CacheNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedCacheNode): CacheNode {
    const node = $createCacheNode();
    //node.__data = serializedNode.__data;

    return node;
  }

  exportJSON(): SerializedCacheNode {
    return {
      ...super.exportJSON(),
      // __data: this.__data || {},
      type: "cache",
      version: 1,
    };
  }
}

export function $createCacheNode(data?: CacheData): CacheNode {
  return new CacheNode(undefined, data);
}

export const $isCacheNode = (node: LexicalNode): node is CacheNode => {
  return node instanceof CacheNode;
};

// If soft is true, new data will be merged into existing data
export const $storeCacheData = (data: CacheData, softMerge = false) => {
  let cacheNode: CacheNode | null = null;
  let ok = false;

  // Check and drop data if its value is undefined
  const cleanedData: CacheData = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      cleanedData[key] = data[key];
    }
  }

  $walkNode($getRoot(), (node) => {
    if ($isCacheNode(node)) {
      const newData = softMerge
        ? {
            ...cleanedData,
            ...node.getLatest().__data,
          }
        : {
            ...node.getLatest().__data,
            ...cleanedData,
          };
      node.getWritable().setData(structuredClone(newData));
      ok = true;
    }
  });

  return ok;
};

export const $emptyCacheData = () => {
  $walkNode($getRoot(), (node) => {
    if ($isCacheNode(node)) {
      node.getWritable().__data = {};
    }
  });
};

export const $getCacheData = <T = any>(key: string): T | undefined => {
  let value: T | undefined = undefined;
  $walkNode($getRoot(), (node) => {
    if ($isCacheNode(node)) {
      value = node.getLatest().getData(key?.trim());
    }
  });

  return value;
};

export const $consoleCacheData = (data?: any) => {
  $walkNode($getRoot(), (node) => {
    if ($isCacheNode(node)) {
      logger.log( "CacheNode data:", node.getLatest().__data, data);
    }
  });
};

export const $getAllCacheData = (): CacheData | null => {
  let allData: CacheData | null = null;
  $walkNode($getRoot(), (node) => {
    if ($isCacheNode(node)) {
      allData = node.getLatest().__data || null;
    }
  });

  return allData;
};

export const getCacheData = <T = any>(
  editor: LexicalEditor,
  key: string
): T | undefined => {
  return editor.getEditorState().read(() => {
    return $getCacheData(key);
  }) as T | undefined;
};

export const syncCacheData = (
  fromEditor: LexicalEditor,
  toEditor: LexicalEditor
) => {
  let cacheData: CacheData = {};
  fromEditor.getEditorState().read(() => {
    $walkNode($getRoot(), (node) => {
      if ($isCacheNode(node)) {
        cacheData = node.getLatest().__data || {};
      }
    });
  });

  toEditor.update(
    () => {
      $storeCacheData(structuredClone(cacheData));
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

const cacheKeyQueryPrefix = "__query";
const cacheKeyURLQueryPrefix = "__url_query";

export const $storeURLQueryCacheByName = (
  dataName: string,
  query: Record<string, any>
) => {
  // Get the existing cache data
  const existingCache =
    ($getAllCacheData() || {})[cacheKeyURLQueryPrefix] || {};

  // Get the existing data for this dataName
  const existingDataForName = existingCache[dataName] || {};

  const newCache = {
    ...existingCache,
    [dataName]: {
      ...existingDataForName,
      ...query,
    },
  };

  $storeCacheData({
    [cacheKeyURLQueryPrefix]: newCache,
  });
};

export const $storeURLQuery = (query: types.URLQueryCacheData) => {
  // Get the existing cache data
  const existingCache =
    ($getAllCacheData() || {})[cacheKeyURLQueryPrefix] || {};

  const newCache = {
    ...existingCache,
    ...query,
  };

  $storeCacheData({
    [cacheKeyURLQueryPrefix]: newCache,
  });
};

export const $storeQueryCache = (query: Record<string, any>) => {
  // Get the existing cache data
  const existingCache = ($getAllCacheData() || {}).__query || {};

  const newCache = {
    ...existingCache,
    ...query,
  };

  $storeCacheData({
    [cacheKeyQueryPrefix]: newCache,
  });
};

export const $getQueryCache = (key: string): any => {
  const queryCache =
    $getCacheData<Record<string, any>>(cacheKeyQueryPrefix) || {};
  return queryCache[key];
};

export const $getURLQueryCache = (
  dataName: string,
  key: string
): Record<string, any> | undefined => {
  const urlQueryCache =
    $getCacheData<Record<string, any>>(cacheKeyURLQueryPrefix) || {};
  return urlQueryCache[dataName]?.[key];
};

export const $getAllURLQueryCache = (): types.URLQueryCacheData => {
  return $getCacheData<types.URLQueryCacheData>(cacheKeyURLQueryPrefix) || {};
};

export const $getAllURLQueryCacheByName = (
  dataName: string
): Record<string, any> => {
  const urlQueryCache =
    $getCacheData<types.URLQueryCacheData>(cacheKeyURLQueryPrefix) || {};
  return urlQueryCache[dataName] || {};
};

export const $getAllQueryCache = (): Record<string, any> => {
  return $getCacheData<Record<string, any>>(cacheKeyQueryPrefix) || {};
};

export const getAllQueryCache = (
  editor: LexicalEditor
): Record<string, any> => {
  return editor.read(() => {
    return $getAllQueryCache();
  }) as Record<string, any>;
};

export const getQueryCache = (editor: LexicalEditor, key: string): any => {
  return editor.read(() => {
    return $getQueryCache(key);
  });
};

export const storeQueryCache = (
  editor: LexicalEditor,
  query: Record<string, any>
) => {
  editor.update(
    () => {
      $storeQueryCache(query);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const storeURLQueryCache = (
  editor: LexicalEditor,
  query: types.URLQueryCacheData
) => {
  editor.update(
    () => {
      $storeURLQuery(query);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};
