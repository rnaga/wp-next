"use server";

import { JSDOM } from "jsdom";
import { $getRoot, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";
import { cache } from "react";

import { $generateHtmlFromNodes } from "@lexical/html";

import { $walkNode, setEditorMode, setFullScreenPreviewMode } from "../lexical";
import { createLexicalEditor } from "../lexical/editor";
import {
  $createCacheNode,
  $getAllCacheData,
  $isCacheNode,
  $storeCacheData,
  storeQueryCache,
  storeURLQueryCache,
} from "../lexical/nodes/cache/CacheNode";
import { WP_VOID_ELEMENT_ATTRIBUTE } from "../lexical/nodes/wp/constants";
import { processAndGetTemplate } from "../lexical/template";
import { auditServerDom } from "../server/setup-dom";
import * as vals from "../validators/index";
import { getTemplateWithConfig } from "./actions/template";
import { parseParamsAndSearchParams } from "./url";

import type * as types from "../types";
import {
  $isDataFetchingNode,
  $storeFetchedData,
} from "../lexical/nodes/data-fetching/DataFetchingNode";
/**
 * Loads and prepares a published template for server-side page rendering.
 *
 * This is a lower-level utility used by server rendering flows that need the
 * processed template payload plus the initialized Lexical editor instance.
 * Unlike `WPPage`, this function does not render JSX and does not call
 * `notFound()`. It returns `false` for any invalid/unavailable state so the
 * caller can decide the final response strategy.
 *
 * Core pipeline:
 * 1. Validate `idOrSlug` to ensure only supported template identifiers are used.
 * 2. Switch Lexical to production mode (`setEditorMode(false)`), because page
 *    rendering should never run with editor-only behaviors enabled.
 * 3. Initialize DOM polyfills via `setupDom()` and create a headless editor.
 * 4. Ensure a `CacheNode` exists before template processing.
 * 5. Resolve template + config via `getTemplateWithConfig(idOrSlug)`.
 * 6. Enforce publish visibility: unpublished templates return `false`.
 * 7. Build URL query cache by merging:
 *    - caller-provided `urlQuery`
 *    - derived values from route params/search params via template config
 * 8. Store URL query cache into `CacheNode` before processing.
 * 9. Execute `processAndGetTemplate(...)` to preload data and finalize render
 *    artifacts needed by downstream SSR steps.
 *
 * Critical ordering guarantee:
 * URL query data MUST be written to `CacheNode` before `processAndGetTemplate`.
 * Data-fetching nodes (including nested widget editors) read from this cache
 * during template processing; writing it later would produce incorrect/missing
 * dynamic data.
 *
 * @param args.idOrSlug Template identifier (numeric ID or slug).
 * @param args.params Optional path segments from dynamic routes.
 * @param args.searchParams Optional URL query object from the request URL.
 * @param args.urlQuery Optional precomputed query cache payload to merge.
 * @param args.previewInfoKey Optional key for preview mode. When present, the
 *   publish-status check is bypassed so that unpublished templates can be
 *   rendered via `/admin/:id/full-preview`. The key is forwarded to
 *   `processAndGetTemplate` for access-controlled preview data resolution.
 *
 * @returns A discriminated union on `valid`:
 * - `{ valid: true, statusType: "VALID", editor, htmlString, cachedData, ...}` on success.
 * - `{ valid: false, statusType, message }` on failure, where `statusType` is one of:
 *   - `"NOT_FOUND"` — template does not exist or is unpublished
 *   - `"TEMPLATE_ERROR"` — template processing failed
 */
export const getWpPage = cache(
  async (
    args: types.WpPageArgs
  ): Promise<
    | {
        valid: false;
        statusType: types.WPPageStatusType;
        message: string;
      }
    | (Exclude<types.ProcessAndGetTemplateResult, "valid"> & {
        valid: true;
        statusType: "VALID";
        editor: LexicalEditor;
        htmlString: string;
        bodyAttributes: Record<string, string>;
        cachedData: ReturnType<typeof $getAllCacheData>;
      })
  > => {
    // Explicitly reset global mode flags to their default (false) on the server.
    // These are module-level globals shared across all requests — enabling them
    // on the server would corrupt state for concurrent requests. Passing false
    // is a safe no-op but makes the intent explicit.
    setEditorMode(false);
    setFullScreenPreviewMode(false);

    const parsedIdOrSlug = vals.url.templateWidgetIdOrSlug.safeParse(
      args.idOrSlug
    );

    if (!parsedIdOrSlug.success) {
      return {
        valid: false,
        statusType: "NOT_FOUND",
        message: "Template not found",
      };
    }

    const idOrSlug = parsedIdOrSlug.data;

    auditServerDom();

    const editor = createLexicalEditor({
      isHeadless: true,
      editable: false,
    });

    // IMPORTANT: Query string propagation to all Lexical editors (root and widget editors)
    // This is a critical initialization step that makes URL query parameters available
    // throughout the entire editor hierarchy. The CacheNode stores these parameters in the
    // root editor and makes them accessible to all nested widget editors (e.g., WidgetNode,
    // DataFetchingNode, PostsDataFetchingNode) that need to access query string values for
    // data fetching or conditional rendering.
    //
    // NOTE: This MUST be done before calling processAndGetTemplate so that widget editors
    // can access query parameters during template processing.
    const cacheNode = editor
      .getEditorState()
      .read(() => $getRoot().getChildren().find($isCacheNode));

    // Create CacheNode if it doesn't exist
    if (!cacheNode) {
      editor.update(
        () => {
          const cacheNode = $createCacheNode();
          $getRoot().getWritable().append(cacheNode);
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    const templateWithConfig = await getTemplateWithConfig(idOrSlug).catch(
      (error) => {
        if (`${error}`.toLowerCase().includes("not found")) {
          return null;
        }

        throw error;
      }
    );

    if (!templateWithConfig) {
      return {
        valid: false,
        statusType: "NOT_FOUND",
        message: "Template not found",
      };
    }

    if (
      (!templateWithConfig.template.post_status ||
        templateWithConfig.template.post_status !== "publish") &&
      // Skip this check when previewInfoKey is present — it indicates a preview
      // request via /admin/:id/full-preview, which is already access-controlled
      // (authenticated users only, key validated in WPPage).
      args.previewInfoKey === undefined
    ) {
      // If the template is not published, return false to prevent access to unpublished content
      return {
        valid: false,
        statusType: "NOT_FOUND",
        message: "Template not published",
      };
    }

    // evaluateRequired is true for public (non-admin) pages only.
    // Admin preview pages pass a previewInfoKey, so required evaluation is skipped for them.
    const isPublicPage = args.previewInfoKey === undefined;

    let urlQuery: types.URLQueryCacheData | undefined;
    try {
      urlQuery = !templateWithConfig.config
        ? args.urlQuery
        : {
            ...args.urlQuery,
            ...parseParamsAndSearchParams({
              params: args.params,
              searchParams: args.searchParams,
              templateConfig: templateWithConfig.config,
              evaluateRequired: isPublicPage,
            }),
          };
    } catch (error) {
      if (`${error}`.toLowerCase().includes("not found")) {
        return {
          valid: false,
          statusType: "NOT_FOUND",
          message: "Required mapping missing from URL",
        };
      }
      throw error;
    }

    // Pass URL query parameters to CacheNode before processing the template
    storeURLQueryCache(editor, {
      ...urlQuery,
    });

    // Process "cacheData" if provided.
    if (args.cacheData) {
      editor.update(
        () => {
          $storeCacheData(args.cacheData!);
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    let result;
    try {
      result = await processAndGetTemplate(idOrSlug, editor, {
        isEditorMode: false,
        previewInfoKey: args.previewInfoKey,
      });
    } catch (error) {
      // If a data-fetching node couldn't find its post, propagate as NOT_FOUND
      // so WPPage can call notFound() instead of rendering a blank/broken page.
      const isNotFound = `${error}`.toLowerCase().includes("not found");
      return {
        valid: false,
        statusType: isNotFound ? "NOT_FOUND" : "TEMPLATE_ERROR",
        message: isNotFound ? "Post not found" : "Template processing failed",
      };
    }

    if (!result.valid) {
      return {
        valid: false,
        statusType: "TEMPLATE_ERROR",
        message: "Template processing failed",
      };
    }

    const htmlString = editor.read(() => $generateHtmlFromNodes(editor, null));

    // Remove elements with data-void-wp-element attribute from the generated HTML string.
    // DOMParser is not available in Node.js — use JSDOM directly (see setup-dom.ts).
    const doc = new JSDOM(htmlString).window.document;
    doc
      .querySelectorAll(`[${WP_VOID_ELEMENT_ATTRIBUTE}]`)
      .forEach((el) => el.remove());

    // Find the body node element - which has the data-lexical-body attribute - and get its computed styles
    const bodyElement = doc.querySelector("[data-lexical-body]");
    if (!bodyElement) {
      return {
        valid: false,
        statusType: "TEMPLATE_ERROR",
        message: "BodyNode element not found in generated HTML",
      };
    }
    const cleanedHtmlString = bodyElement.innerHTML;

    // Collect all attributes set on the BodyNode element to be applied to the <body> tag
    const BODY_ATTRIBUTE_EXCLUSIONS = new Set(["data-lexical-body"]);
    const bodyAttributes: Record<string, string> = {};
    for (const attr of Array.from(bodyElement.attributes)) {
      if (!BODY_ATTRIBUTE_EXCLUSIONS.has(attr.name)) {
        bodyAttributes[attr.name] = attr.value;
      }
    }

    // Store query to Cache Node before serializing
    storeQueryCache(editor, {
      templateId: result.template.ID,
    });

    const cachedData = editor.getEditorState().read(() => $getAllCacheData());

    if (!result.valid) {
      return {
        valid: false,
        statusType: "TEMPLATE_ERROR",
        message: "Template processing failed",
      };
    }

    return {
      ...result,
      statusType: "VALID",
      editor,
      htmlString: cleanedHtmlString,
      bodyAttributes,
      cachedData,
    };
  }
);
