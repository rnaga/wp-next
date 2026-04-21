import { z } from "zod";

import type * as wpTypes from "@rnaga/wp-node/types";
import { errorDataFetchingValidator } from "./error-data-fetching-validator";
import type * as types from "../../../types";

import {
  DataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { is } from "zod/v4/locales";
import { isErrorSlug } from "../../validate-slug";
import { $getRoot, LexicalEditor } from "lexical";
import { $walkNode } from "../../walk-node";
import { $getAllCacheData, $storeCacheData } from "../cache/CacheNode";

type Data = z.infer<typeof errorDataFetchingValidator>;

export const CACHE_ERROR_DATA_KEY = "__errorData__";

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [];

/**
 * A specialised {@link DataFetchingNode} that represents an error state for
 * error page templates (slugs listed in `TEMPLATE_SLUGS_ERROR`).
 *
 * **Lifecycle**
 * The node is inserted automatically in two places:
 * 1. When an error template is first created (`server/actions/template.ts`).
 * 2. As a safety fallback inside `processAndGetTemplate` (`lexical/template.ts`)
 *    in case the node is missing for any reason.
 *
 * **Data flow**
 * {@link ErrorDataFetchingNode.fetch} falls back to a generic `UNKNOWN_ERROR`
 * default, but reads the actual `error_type` and `error_message` from a
 * `CacheNode` entry stored under the key `CACHE_DATA_KEY` (`"__errorData__"`).
 *
 * The cache entry is written in two ways:
 * - At render time: `WPError` (`server/components/WPError.tsx`) builds a
 *   `cacheData` object with the `__errorData__` key and passes it to
 *   `getWpPage` (`server/get-wp-page.ts`), which stores it into the editor's
 *   `CacheNode` via `$storeCacheData` before template processing begins.
 * - Programmatically: call `$cacheErrorData(errorType, errorMessage)`, which
 *   writes the same shape via `$storeCacheData({ [CACHE_ERROR_DATA_KEY]: { ... } })`.
 *
 * During `fetch`, the node reads `$getAllCacheData()?.[CACHE_ERROR_DATA_KEY]` from
 * the editor and uses those values (falling back to the defaults when absent).
 *
 * `WPError` is also responsible for selecting the appropriate error page slug
 * (e.g. `"error-not-found"`) and falling back to the generic `"error"` page.
 */
export class ErrorDataFetchingNode extends DataFetchingNode<{}, Data> {
  __hidden: boolean = true;

  constructor(key?: string) {
    super(key);
    this.setName("error");
  }

  static getValidator() {
    return errorDataFetchingValidator;
  }

  static getType(): string {
    return "error-data";
  }

  static clone(node: ErrorDataFetchingNode): ErrorDataFetchingNode {
    const newNode = new ErrorDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): ErrorDataFetchingNode {
    const node = $createErrorDataFetchingNode();
    node.afterImportJSON(serializedNode);
    node.__type = ErrorDataFetchingNode.getType();
    return node;
  }

  exportJSON(): SerializedDataFetchingNode {
    return {
      ...super.exportJSON(),
    };
  }

  async fetch(
    serverActions: types.DataServerActions,
    editor?: LexicalEditor
  ): Promise<[z.infer<typeof errorDataFetchingValidator> | undefined]> {
    const defaultError = {
      error_type: "UNKNOWN_ERROR",
      error_message: "An unexpected error occurred.",
    } as z.infer<typeof errorDataFetchingValidator>;

    if (editor) {
      // Attempt to read error data from the editor's cache.
      // This allows `WPError` to pass dynamic error information (type and message) to the `ErrorDataFetchingNode`
      const cacheData = editor.read(
        () =>
          $getAllCacheData()?.[CACHE_ERROR_DATA_KEY] as
            | z.infer<typeof errorDataFetchingValidator>
            | undefined
      );

      return [
        {
          error_type: cacheData?.error_type || defaultError.error_type,
          error_message: cacheData?.error_message || defaultError.error_message,
        },
      ];
    }

    return [defaultError];
  }
}

export const $createErrorDataFetchingNode = () => {
  const node = new ErrorDataFetchingNode();
  return node;
};

export const $isErrorDataFetchingNode = (
  node: unknown
): node is ErrorDataFetchingNode => node instanceof ErrorDataFetchingNode;

export const $checkAndInsertErrorDataFetchingNode = (slug: string) => {
  if (!isErrorSlug(slug)) {
    return;
  }

  // Check if an error data fetching node already exists in the editor. If it does, do nothing.
  let errorNode: ErrorDataFetchingNode | null = null;
  $walkNode($getRoot(), (node) => {
    if ($isErrorDataFetchingNode(node)) {
      errorNode = node;
      return false; // Stop walking the tree once we find an error data fetching node
    }
    return true;
  });

  // Error Node doesn't exits. Create and insert it.
  if (!errorNode) {
    const newErrorNode = $createErrorDataFetchingNode();
    $getRoot().getWritable().append(newErrorNode);
  }
};

export const $cacheErrorData = (
  errorType: types.WPPageStatusType,
  errorMessage: string
) => {
  $storeCacheData({
    [CACHE_ERROR_DATA_KEY]: {
      error_type: errorType,
      error_message: errorMessage,
    },
  });
};
