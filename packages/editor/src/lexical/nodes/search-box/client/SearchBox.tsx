"use client";
import { CSSProperties, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { isServerSide } from "../../../environment";
import { getAllQueryCache, storeQueryCache } from "../../cache/CacheNode";
import { useDataFetching } from "../../data-fetching/client/use-data-fetching";
import { getURLQueryCacheByCollection } from "../../data-fetching/DataFetchingNode";
import { SEARCH_BOX_NODE_SEARCH_COMMAND } from "../commands";
import { SearchBoxConfig } from "../SearchBoxNode";
import { styles } from "./styles";
import { logger } from "../../../logger";

const updateUrlForPage = (
  search: string,
  urlType: "none" | "query" | "segment"
) => {
  if (isServerSide() || urlType === "none") {
    return;
  }

  const url = new URL(window.location.href);

  switch (urlType) {
    case "query":
      if (search === "") {
        url.searchParams.delete("search");
      } else {
        url.searchParams.set("search", search);
      }
      // Remove any stale page param so the URL stays clean after a new search.
      url.searchParams.delete("page");
      break;

    case "segment": {
      // Remove existing search segment if present (e.g., /hello, /hello%20world)
      const cleanedPath = url.pathname.replace(/\/[^/]+\/?$/, "");
      const hasTrailingSlash = url.pathname.endsWith("/");
      const encodedSearch = encodeURIComponent(search);

      // Add new search segment, preserving trailing slash preference
      url.pathname = hasTrailingSlash
        ? `${cleanedPath}/${encodedSearch}/`
        : `${cleanedPath}/${encodedSearch}`;
      break;
    }
  }

  window.history.pushState({}, "", url.toString());
};

export const SearchBox = (props: { config: SearchBoxConfig }) => {
  const {
    targetCollection,
    dropdown,
    placeholder,
    urlType = "none",
  } = props.config;

  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const [searchQuery, setSearchQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // Tracks whether the user has submitted a search — controls reset button visibility
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    fetchData,
    fetchDataAndUpdateCollectionView,
    findDataFetchingNodeByCollection,
  } = useDataFetching();

  // Pre-fill the search input from URL query cache on mount.
  // When search is passed via ?search=... or a path segment mapped to "search",
  // the value is already stored in the URL query cache by the time this component renders.
  useEffect(() => {
    if (!targetCollection) {
      return;
    }

    const urlQueryCache = getURLQueryCacheByCollection(
      editor,
      targetCollection
    );
    const searchValue = urlQueryCache?.search;

    if (searchValue !== undefined && searchValue !== "") {
      setSearchQuery(String(searchValue));
      setHasSearched(true);
      // Sync into the shared query cache so sibling nodes (e.g. Pagination)
      // can read the search value on their first interaction, even before the
      // user submits the search form.
      storeQueryCache(editor, { search: String(searchValue) });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        formRef.current &&
        !formRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Show dropdown only if enabled in config and there's a query
    if (dropdown?.enable && value.length > 0) {
      setShowDropdown(true);

      // Fetch search results for dropdown
      const query = getAllQueryCache(editor);
      const templateId = query.templateId;

      if (templateId && targetCollection) {
        // fetchData requires the data fetching node's own name, not the collection name.
        // Resolve it by looking up the DataFetchingNode linked to this collection.
        const dataFetchingNodeResult =
          findDataFetchingNodeByCollection(targetCollection);
        const dataFetchingName = dataFetchingNodeResult
          ? dataFetchingNodeResult[1].read(() =>
              dataFetchingNodeResult[0].getName()
            )
          : null;

        if (!dataFetchingName) {
          return;
        }

        const result = await fetchData({
          templateId,
          dataFetchingName,
          query: {
            search: value,
            per_page: 5,
            limit: 5,
          },
        });

        if (result?.success && result.result?.data) {
          setSearchResults(
            Array.isArray(result.result.data) ? result.result.data : []
          );
        }
      }
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const handleResultClick = (result: any) => {
    // Strip collection name prefix from field path
    const stripPrefix = (path: string) => {
      const parts = path.split(".");
      return parts.length > 1 ? parts.slice(1).join(".") : path;
    };

    // Get the main field value to set as search query
    const mainFieldValue = dropdown?.mainField
      ? getNestedValue(result, stripPrefix(dropdown.mainField))
      : "";

    setSearchQuery(String(mainFieldValue || ""));
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);

    const query = getAllQueryCache(editor);
    const templateId = query.templateId;

    if (!templateId || !targetCollection) {
      logger.warn( "SearchBox: Missing templateId or targetCollection");
      return;
    }

    // Update URL: set/remove search param, also strips stale page param.
    updateUrlForPage(searchQuery, urlType);

    // Notify listeners (e.g. PaginationNode) that a search was submitted.
    // Handlers share the states bag to coordinate — the first handler that acts
    // can set a flag so subsequent handlers know the work is already done.
    wpHooks.filter.applyCommand(SEARCH_BOX_NODE_SEARCH_COMMAND, {
      targetCollection,
      states: {},
    });

    // Store the search value in the shared query cache so sibling nodes
    // (e.g. Pagination) read the correct value on their next interaction.
    // Page reset is handled by Pagination via SEARCH_BOX_NODE_SEARCH_COMMAND.
    storeQueryCache(editor, { search: searchQuery });

    await fetchDataAndUpdateCollectionView({
      templateId,
      targetCollection,
      query: {
        search: searchQuery,
        page: 1,
      },
    });

    setHasSearched(true);
  };

  const handleReset = async () => {
    setSearchQuery("");
    setHasSearched(false);
    setShowDropdown(false);

    const query = getAllQueryCache(editor);
    const templateId = query.templateId;

    if (!templateId || !targetCollection) {
      return;
    }

    updateUrlForPage("", urlType);

    // Notify Pagination listeners to reset the page, same as on search submit.
    wpHooks.filter.applyCommand(SEARCH_BOX_NODE_SEARCH_COMMAND, {
      targetCollection,
      states: {},
    });

    // Clear search in the shared query cache. Page reset is handled by
    // Pagination via SEARCH_BOX_NODE_SEARCH_COMMAND above.
    storeQueryCache(editor, { search: "" });

    await fetchDataAndUpdateCollectionView({
      templateId,
      targetCollection,
      query: {
        search: "",
        page: 1,
      },
    });
  };

  // Helper function to get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const inputStyle: CSSProperties = {
    ...styles.input,
    ...(isFocused && {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 1px #3b82f6",
    }),
  };

  const buttonStyle: CSSProperties = {
    ...styles.button,
    ...(isHovered && {
      background: "#e5e7eb",
      color: "#1f2937",
    }),
  };

  return (
    <div style={styles.container}>
      <form ref={formRef} style={styles.form} onSubmit={handleSubmit}>
        <div
          style={{ position: "relative", flex: 1, minWidth: 0, height: "100%" }}
        >
          <input
            type="text"
            style={{
              ...inputStyle,
              flex: "none",
              width: "100%",
              // Reserve space for the reset button so text doesn't overlap it
              paddingRight: hasSearched ? "32px" : "12px",
            }}
            placeholder={placeholder || "Search..."}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {hasSearched && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                width: "16px",
                height: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          style={buttonStyle}
          aria-label="Search"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <svg
            style={styles.icon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.5 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
      </form>

      {showDropdown && dropdown?.enable && (
        <div ref={dropdownRef} style={styles.dropdown}>
          {searchResults.length > 0 ? (
            searchResults.map((result, index) => {
              // Strip collection name prefix from field paths (e.g., "posts.post_title" -> "post_title")
              const stripPrefix = (path: string) => {
                const parts = path.split(".");
                return parts.length > 1 ? parts.slice(1).join(".") : path;
              };

              const mainValue = dropdown?.mainField
                ? getNestedValue(result, stripPrefix(dropdown.mainField))
                : "";
              const subtitleValue = dropdown?.subtitleField
                ? getNestedValue(result, stripPrefix(dropdown.subtitleField))
                : "";

              return (
                <div
                  key={index}
                  style={styles.resultItem}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "#ffffff";
                  }}
                >
                  <div style={styles.resultTitle}>
                    {String(mainValue || "")}
                  </div>
                  {subtitleValue && (
                    <div style={styles.resultDescription}>
                      {String(subtitleValue)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: "12px", color: "#9ca3af" }}>
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
