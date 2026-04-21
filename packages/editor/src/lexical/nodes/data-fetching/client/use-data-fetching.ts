import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";
import { useEditorServerActions } from "../../../../client/hooks/use-editor-server-actions";
import { $refreshNode } from "../../../lexical";
import {
  findCollectionByName,
  findDataFetchingNodeByCollectionName,
} from "../../collection/CollectionNode";
import {
  getWidgetEditorStateCacheData,
  getGZipWidgetEditorStateCacheData,
  processAllWidgetsSync,
  getGZipEditorState,
} from "../../widget/WidgetNode";
import {
  $storeFetchedData,
  $storeWidgetGlobalCache,
  DataFetchingNode,
  DataFetchingPagination,
  findDataFetchingNodeByName,
} from "../DataFetchingNode";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { processAndGetTemplateSync } from "../../../template";
import { $getAllCacheData } from "../../cache/CacheNode";
import { gzipJSON } from "../../../gzip";
import { reloadDynamicValues } from "./reload-dynamic-values";
import { logger } from "../../../logger";

type FetchDataResult<T> =
  | { success: false; message: string; result?: never }
  | {
      success: true;
      result: { data: T; info: DataFetchingPagination };
      message?: never;
    };

export const useDataFetching = () => {
  const [editor] = useLexicalComposerContext();
  const { actions, safeParse } = useEditorServerActions();
  const { wpHooks } = useWP();

  // Finds a DataFetchingNode by its own name across the full editor tree including widgets.
  const findDataFetchingNode = (
    dataFetchingName: string
  ): [DataFetchingNode, LexicalEditor] | null => {
    return findDataFetchingNodeByName(editor, dataFetchingName) ?? null;
  };

  // Finds the DataFetchingNode linked to a CollectionNode with the given name.
  const findDataFetchingNodeByCollection = (
    collectionName: string
  ): [DataFetchingNode, LexicalEditor] | null => {
    return findDataFetchingNodeByCollectionName(editor, collectionName) ?? null;
  };

  const fetchData = async <T = any>(args: {
    templateId: number;
    dataFetchingName: string;
    query?: Record<string, any>;
  }): Promise<FetchDataResult<T>> => {
    const { templateId, query, dataFetchingName } = args;

    const gzipEditorStateString = await getGZipEditorState(editor);
    const gzipStringCache = await getGZipWidgetEditorStateCacheData(editor);

    const result = await actions.dataFetching
      .get({
        templateId,
        dataName: dataFetchingName,
        query,
        gzipEditorStateString,
        options: {
          gzipCacheData: gzipStringCache,
        },
      })
      .then(safeParse);

    return {
      success: true,
      result,
    };
  };

  /**
   * Fetches data from the server for a given data fetching node name and updates the Lexical
   * editor state (cache, widget global cache, node refresh, template re-processing).
   *
   * This is the shared core used by fetchDataAndUpdateCollectionView and any other caller
   * that needs updated editor state without collection-specific DOM manipulation.
   *
   * When the result has zero items (pagination.count === 0), the editor state mutation is
   * intentionally skipped. This preserves the existing collection item nodes in the tree
   * so they can be repopulated when a subsequent fetch returns results. The caller is
   * responsible for hiding the collection from view (e.g. via inline display:none).
   */
  const fetchDataAndUpdateEditor = async <T = any>(args: {
    templateId: number;
    dataFetchingName: string;
    query?: Record<string, any>;
  }): Promise<FetchDataResult<T>> => {
    const { templateId, query, dataFetchingName } = args;

    const editorStateString = JSON.stringify(editor.getEditorState().toJSON());
    const gzipEditorStateString = await getGZipEditorState(editor);
    const gzipStringCache = await getGZipWidgetEditorStateCacheData(editor);

    const result = await actions.dataFetching
      .get({
        templateId,
        dataName: dataFetchingName,
        query,
        gzipEditorStateString,
        options: {
          gzipCacheData: gzipStringCache,
        },
      })
      .then(safeParse);

    const pagination = result.info as DataFetchingPagination;

    // When the result has no items, skip item-data and DOM mutations so that
    // existing collection item nodes remain in the tree — they will be
    // repopulated when a subsequent fetch returns results.
    //
    // IMPORTANT: We must still commit the new pagination to the cache even when
    // count is 0. Dynamic-attribute conditions can reference pagination fields
    // via ${%pagination.*} expressions (e.g. "count > 0"). If we skip this
    // update, computeAttributes() in reloadDynamicValues reads the stale count
    // from the previous fetch, causing display:none to persist incorrectly when
    // the condition is no longer true.
    if (pagination.count === 0) {
      editor.update(
        () => {
          // Store only pagination — not item data — so that $getFetchedPagination
          // returns the current count. We pass [] for data to avoid overwriting
          // the existing collection items in the cache (preserving them for the
          // next non-empty fetch).
          //
          // $storeWidgetGlobalCache is intentionally omitted: it feeds nested
          // widget editors which expect the previous items to still be present.
          // Pushing [] there would cause widget-level inconsistencies.
          $storeFetchedData(dataFetchingName, [], pagination);
        },
        { discrete: true, tag: HISTORY_MERGE_TAG }
      );
      return { success: true, result };
    }

    // Store fetched data in the standard cache location for data fetching nodes.
    // This updates the cache keys: "data-fetching-node-{dataFetchingName}" and
    // "data-fetching-node-{dataFetchingName}-pagination".
    // Also updates widget global cache so nested widgets can access the updated data.
    editor.update(
      () => {
        $storeFetchedData(dataFetchingName, result.data, pagination);
        $storeWidgetGlobalCache(dataFetchingName, result.data, pagination);

        // Force update of all nodes in the root editor tree with the newly fetched data.
        $refreshNode($getRoot());
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    const cacheData = editor.read(() => $getAllCacheData());

    // Synchronously re-process the root editor and all nested widget editors to reflect
    // the newly fetched data. Widgets maintain their own Lexical editor instances with
    // separate state, so global cache updates don't propagate automatically.
    processAndGetTemplateSync(editor, editorStateString, cacheData ?? {});

    return { success: true, result };
  };

  /**
   * Fetches data for a collection, updates the Lexical editor state via fetchDataAndUpdateEditor,
   * then replaces the collection's DOM element with freshly generated HTML.
   *
   * This is the collection-specific counterpart to fetchDataAndUpdateEditor. Use this when the
   * data source is a CollectionNode and you need both the editor state and the live DOM updated.
   *
   * Zero-result handling: when pagination.count === 0, fetchDataAndUpdateEditor skips editor
   * mutations to preserve collection item nodes. Here we find the collection's DOM element and
   * apply inline display:none so the empty state is hidden without destroying DOM structure.
   * When count > 0 (including after a previous zero-result), display:none is removed before
   * regenerating the collection HTML so the items become visible again.
   */
  const fetchDataAndUpdateCollectionView = async <T = any>(args: {
    templateId: number;
    targetCollection: string;
    query?: Record<string, any>;
    dataFetchingId?: string;
  }): Promise<FetchDataResult<T>> => {
    const { templateId, query, targetCollection, dataFetchingId } = args;

    // Resolve the data fetching name from the linked collection node
    const resultDataFetchingNode =
      findDataFetchingNodeByCollection(targetCollection);
    if (!resultDataFetchingNode) {
      return { success: false, message: "Data fetching node not found" };
    }
    const [dataFetchingNode, targetEditor] = resultDataFetchingNode;
    const dataFetchingName = targetEditor.read(() =>
      dataFetchingNode.getName()
    );

    const editorResult = await fetchDataAndUpdateEditor<T>({
      templateId,
      dataFetchingName,
      query,
    });

    if (!editorResult.success) {
      return editorResult;
    }

    const { result } = editorResult;
    const pagination = result.info as DataFetchingPagination;

    // Now get the target collection node to generate HTML
    const resultCollection = findCollectionByName(editor, targetCollection);
    if (!resultCollection) {
      logger.log( "no collection found");
      return { success: false, message: "No collection found" };
    }

    const [collectionNode, collectionEditor] = resultCollection;
    const collectionCssClassName = collectionEditor.read(() =>
      collectionNode.__css?.getClassName()
    );

    if (pagination.count === 0) {
      // Zero results: hide the collection element so its existing DOM (and the
      // corresponding Lexical nodes) are preserved for the next non-empty fetch.
      if (collectionCssClassName) {
        const collectionEl = document.querySelector<HTMLElement>(
          `.${collectionCssClassName}`
        );

        if (collectionEl) {
          collectionEl.style.setProperty("display", "none");
        }
      }
    } else {
      // Non-zero results: ensure any previous zero-result hide is cleared before
      // regenerating so the collection becomes visible again.
      if (collectionCssClassName) {
        const collectionEl = document.querySelector<HTMLElement>(
          `.${collectionCssClassName}`
        );

        if (collectionEl) {
          collectionEl.style.removeProperty("display");
        }
      }
    }

    // Always call reloadDynamicValues regardless of result count so that
    // dynamic values tied to non-collection elements (e.g. pagination counters,
    // template text outside the collection) stay in sync with the latest fetch.
    reloadDynamicValues(
      editor,
      {
        collectionName: targetCollection,
        dataFetchingName,
      },
      {
        wpHooks,
        query: query ?? {},
        fetchedData: [result.data, pagination as DataFetchingPagination],
        dataFetchingId,
      }
    );

    return { success: true, result };
  };

  return {
    findDataFetchingNode,
    findDataFetchingNodeByCollection,
    fetchData,
    fetchDataAndUpdateEditor,
    fetchDataAndUpdateCollectionView,
    /** Re-evaluate dynamic attributes and template text nodes in the editor
     * tree and patch the live DOM to reflect current data values.
     *
     * Call this after any client-side data mutation (pagination, ReactDecorators,
     * etc.) to keep non-collection DOM elements in sync without a full page reload.
     *
     * @param options.dataFetchingName - Optional name of the data fetching node that
     *   was mutated. When provided, only nodes that reference this data source are
     *   updated. When omitted, all dynamic nodes are re-evaluated.
     */
    reloadDynamicValues: (options?: {
      dataFetchingName?: string;
      collectionName?: string;
    }) => reloadDynamicValues(editor, options, { wpHooks }),
  };
};
