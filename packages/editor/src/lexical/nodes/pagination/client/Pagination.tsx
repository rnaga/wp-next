"use client";

import { COMMAND_PRIORITY_HIGH } from "lexical";
import { useEffect, useId, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import * as types from "../../../../types";
import { isServerSide } from "../../../environment";
import { getAllQueryCache, storeQueryCache } from "../../cache/CacheNode";
import { useDataFetching } from "../../data-fetching/client/use-data-fetching";
import {
  DATA_FETCHING_NODE_FETCHED_COMMAND,
  RELOAD_DYNAMIC_VALUE_COMMAND,
} from "../../data-fetching/commands";
import {
  $getFetchedPagination,
  DataFetchingNode,
  DataFetchingPagination,
} from "../../data-fetching/DataFetchingNode";
import { SEARCH_BOX_NODE_SEARCH_COMMAND } from "../../search-box/commands";
import { PaginationConfig } from "../PaginationNode";
import { logger } from "../../../logger";

const updateUrlForPage = (
  page: number,
  urlType: "none" | "query" | "segment",
  // Additional query key/value pairs to sync to the URL. Empty string values
  // are deleted from the URL so stale params don't linger after a reset.
  additionalQuery: Record<string, any> = {},
  additionalQueryKeys: string[] = []
) => {
  // Don't attempt to update URL on the server or if urlType is "none"
  if (isServerSide() || urlType === "none") {
    return;
  }

  const url = new URL(window.location.href);

  switch (urlType) {
    case "query":
      // Page 1 is the default — remove the param rather than setting ?page=1
      if (page <= 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", String(page));
      }

      // Sync additional keys: set non-empty values, delete empty ones
      for (const key of additionalQueryKeys) {
        const value = additionalQuery[key];

        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        } else {
          url.searchParams.delete(key);
        }
      }
      break;

    case "segment": {
      // Remove existing page segment if present (e.g., /1, /2, /123)
      const cleanedPath = url.pathname.replace(/\/\d+\/?$/, "");
      const hasTrailingSlash = url.pathname.endsWith("/");

      // Add new page segment, preserving trailing slash preference
      url.pathname = hasTrailingSlash
        ? `${cleanedPath}/${page}/`
        : `${cleanedPath}/${page}`;
      break;
    }
  }

  window.history.pushState({}, "", url.toString());
};

export const Pagination = (props: { config: PaginationConfig }) => {
  const { targetCollection, urlType = "none" } = props.config;

  const uniqueId = useId();
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const [paginationData, setPaginationData] =
    useState<DataFetchingPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const { findDataFetchingNodeByCollection, fetchDataAndUpdateCollectionView } =
    useDataFetching();

  useEffect(() => {
    if (!targetCollection) return;
    const result = findDataFetchingNodeByCollection(targetCollection);

    if (!result) return;
    const [dataFetchingNode, targetEditor] = result;

    targetEditor.read(() => {
      const dataName = dataFetchingNode.getName();
      const pagination = $getFetchedPagination(dataName);

      setPaginationData(pagination ?? null);
    });
  }, [props.config]);

  useEffect(() => {
    return editor.registerCommand(
      DATA_FETCHING_NODE_FETCHED_COMMAND,
      (payload: { node: DataFetchingNode }) => {
        if (!targetCollection) {
          return false;
        }

        const result = findDataFetchingNodeByCollection(targetCollection);
        if (!result) {
          return false;
        }

        const [dataFetchingNode, targetEditor] = result;

        targetEditor.read(() => {
          const dataName = dataFetchingNode.getName();
          const pagination = $getFetchedPagination(dataName);

          setPaginationData(pagination ?? null);
        });
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [props.config]);

  // When SearchBox submits or resets, reset this Pagination's page to 1.
  // Uses a filter command so multiple PaginationNodes can listen; the states
  // bag prevents duplicate work when more than one Pagination targets the
  // same collection.
  useEffect(() => {
    return wpHooks.filter.addCommand(SEARCH_BOX_NODE_SEARCH_COMMAND, (args) => {
      if (args.targetCollection !== targetCollection) {
        return args;
      }

      // Another Pagination tied to the same collection already reset the page —
      // skip to avoid double-processing when multiple PaginationNodes exist.
      if (args.states.pageReset) {
        return args;
      }

      // Reset page to 1 in the URL. Both urlType modes are handled:
      // "query" removes the ?page param, "segment" rewrites the path segment.
      updateUrlForPage(1, urlType);

      // Update the shared query cache so subsequent nodes (e.g. another
      // Pagination) read page 1 on their next interaction.
      storeQueryCache(editor, { page: 1 });

      args.states.pageReset = true;
      return args;
    });
  }, [props.config]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      RELOAD_DYNAMIC_VALUE_COMMAND,
      (payload: types.DynamicValuesReloadedPayload) => {
        if (payload.targetCollection !== targetCollection) {
          return;
        }

        // Pagination is the second element of fetchedData when present
        if (!payload.fetchedData || payload.fetchedData.length < 2) {
          return;
        }

        setPaginationData(payload.fetchedData[1] as DataFetchingPagination);
      }
    );
  }, [props.config, uniqueId]);

  const handlePageChange = async (newPage: number) => {
    // Get template id and any cached query values from Cache Node
    const cachedQuery = getAllQueryCache(editor);

    const templateId = cachedQuery.templateId;
    const targetCollection = props.config.targetCollection;

    if (!templateId || !targetCollection) {
      logger.log( "Pagination: Missing templateId or targetCollection", {
        cachedQuery,
        templateId,
        targetCollection,
      });
      return;
    }

    // Build extra query params from keys the user configured in the panel
    // (e.g. "search"). Each key is read from the shared query cache so any
    // sibling node (like SearchBox) that stored a value there will be picked up.
    const additionalQueryKeys = props.config.additionalQueryKeys ?? [];
    const additionalQuery: Record<string, any> = {};

    for (const key of additionalQueryKeys) {
      const value = cachedQuery[key];

      if (value !== undefined && value !== "") {
        additionalQuery[key] = value;
      }
    }

    // Update URL based on urlType configuration, syncing additional keys so
    // empty values (e.g. a cleared search) are stripped from the URL as well.
    updateUrlForPage(newPage, urlType, additionalQuery, additionalQueryKeys);

    await fetchDataAndUpdateCollectionView({
      templateId,
      targetCollection,
      query: { ...additionalQuery, page: newPage },
      dataFetchingId: uniqueId,
    });
  };

  if (!paginationData) {
    return <>No Pagination Data</>;
  }

  const { page, totalPage, count, limit } = paginationData;
  const hasPrevious = page > 1;
  const hasNext = page < totalPage;
  const cx = props.config.classNames ?? {};

  const getPageNumbers = () => {
    const MAX_PAGES_TO_SHOW = 7;
    const PAGES_AROUND_CURRENT = 1;

    if (totalPage <= MAX_PAGES_TO_SHOW) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];
    const startPage = Math.max(2, page - PAGES_AROUND_CURRENT);
    const endPage = Math.min(totalPage - 1, page + PAGES_AROUND_CURRENT);

    const showStartEllipsis = startPage > 2;
    const showEndEllipsis = endPage < totalPage - 1;

    if (showStartEllipsis) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (showEndEllipsis) {
      pages.push("...");
    }

    pages.push(totalPage);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cx.container ?? "pagination-container"}>
      <p className={cx.info ?? "pagination-info"}>
        Page {page} of {totalPage} (Total: {count} items)
      </p>
      <div className={cx.controls ?? "pagination-controls"}>
        {hasPrevious && (
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={loading}
            className={`${cx.button ?? "pagination-button"} prev`}
          >
            Previous
          </button>
        )}

        {pageNumbers.map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className={cx.ellipsis ?? "pagination-ellipsis"}
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum as number)}
              disabled={loading || pageNum === page}
              className={`${cx.button ?? "pagination-button"}${pageNum === page ? " active" : ""}`}
            >
              {pageNum}
            </button>
          )
        )}

        {hasNext && (
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={loading}
            className={`${cx.button ?? "pagination-button"} next`}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
