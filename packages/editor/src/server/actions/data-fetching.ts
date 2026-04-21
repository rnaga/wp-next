"use server";
import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import {
  createResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import { logger } from "@rnaga/wp-next-core/server/utils/logger";
import type * as wpAdminTypes from "@rnaga/wp-next-admin/types";

import { WP } from "@rnaga/wp-next-core/server/wp";

import { registerNodeCreators } from "../../lexical/nodes";

import { get as getTemplate } from "./template";
import { auditServerDom } from "../setup-dom";
import { createLexicalEditor, walkNodeWithWidgets } from "../../lexical";
import {
  processAllWidgets,
  processAllWidgetsSync,
} from "../../lexical/nodes/widget/WidgetNode";
import {
  $getRoot,
  EditorState,
  HISTORY_MERGE_TAG,
  LexicalEditor,
} from "lexical";
import {
  $isDataFetchingNode,
  DataFetchingNode,
  DataFetchingPagination,
  fetchDataFetchingNode,
} from "../../lexical/nodes/data-fetching/DataFetchingNode";
import {
  $createCacheNode,
  $isCacheNode,
} from "../../lexical/nodes/cache/CacheNode";
import { getServerActionsUtils } from "@rnaga/wp-next-core/server/utils/get-server-actions-utils";
import { getEditorServerActionsUtils } from "./get-editor-server-actions-utils";
import { $isWPLexicalNode } from "../../lexical/nodes/wp";
import type { CacheData } from "../../lexical/nodes/cache/CacheNode";
import { gunzipToJSON, gunzipToString } from "../../lexical/gzip";

// TODO: Refactor to remove the caller's responsibility for passing gzipCacheData and gzipEditorStateString.
// These gzip params exist for performance — their values should be cached on the server side
// so the client doesn't need to send them. This function should internally fetch the template
// by templateId, parse its editor state, and extract the cache data — so the caller only needs
// to provide templateId, dataName, and optional query params.
export const get = async (args: {
  templateId: number;
  dataName: string;
  query?: Record<string, any>;
  gzipEditorStateString?: string;
  options?: {
    gzipCacheData?: string;
    cacheData?: CacheData;
  };
}): Promise<
  wpAdminTypes.server.actions.ReponsePayload<{
    data: any;
    info: DataFetchingPagination;
  }>
> => {
  const { templateId, dataName, query = {}, gzipEditorStateString } = args;

  const wp = await WP();
  auditServerDom();

  // Register node creators BEFORE creating the editor
  registerNodeCreators();

  const editor = createLexicalEditor({
    isHeadless: true,
    editable: true,
  });

  let jsonContent: string = "";

  const editorStateString = gzipEditorStateString
    ? await gunzipToString(gzipEditorStateString)
    : undefined;

  // In Editor mode, editorStateString can be provided for previewing
  // But we need to validate permissions first.
  if (editorStateString) {
    // check for permission to use the provided editor state
    const user = wp.current.user;

    // User should be able to edit posts, otherwise return not permitted
    if (!user || !(await user.can(`edit_posts`))) {
      return createResponsePayload({
        success: false,
        error: "Not permitted to use the provided editor state",
      });
    }

    jsonContent = editorStateString;
  } else {
    const { data } = await getTemplate(templateId);

    if (!data || !data.post_content) {
      return createResponsePayload({
        success: false,
        error: "Template not found",
      });
    }

    jsonContent = data?.post_content;
  }

  // Parse and validate the JSON content
  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonContent);
  } catch (e) {
    return createResponsePayload({
      success: false,
      error: `Invalid JSON content: ${
        e instanceof Error ? e.message : String(e)
      }`,
    });
  }

  // Handle both wrapped and unwrapped formats
  // If the JSON has an 'editorState' wrapper, unwrap it
  let editorStateJson = parsedJson;
  if (parsedJson.editorState && !parsedJson.root) {
    editorStateJson = parsedJson.editorState;
  }

  // Validate the root structure
  if (!editorStateJson?.root) {
    return createResponsePayload({
      success: false,
      error: "Invalid editor state: missing root node",
    });
  }

  // Parse the editor state and check if it's empty
  let editorState: EditorState;
  try {
    // parseEditorState expects the JSON string, not the parsed object
    const editorStateString = JSON.stringify(editorStateJson);
    editorState = editor.parseEditorState(editorStateString);
  } catch (e) {
    logger.error( "Error parsing editor state:", e);
    return createResponsePayload({
      success: false,
      error: `Failed to parse editor state: ${
        e instanceof Error ? e.message : String(e)
      }`,
    });
  }

  if (editorState.isEmpty()) {
    return createResponsePayload({
      success: false,
      error: "Parsed editor state is empty",
    });
  }

  try {
    editor.update(
      () => {
        editor.setEditorState(editorState);
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  } catch (e) {
    logger.error( "Error setting editor state:", e);
    return createResponsePayload({
      success: false,
      error: `Failed to set editor state: ${
        e instanceof Error ? e.message : String(e)
      }`,
    });
  }

  // Ensure a CacheNode exists before processing widgets.
  // processAllWidgets reads/writes cache data from the parent editor,
  // so a CacheNode must be present in the root.
  let cacheData: CacheData | undefined = args.options?.gzipCacheData
    ? await gunzipToJSON(args.options.gzipCacheData)
    : args.options?.cacheData;

  if (cacheData) {
    editor.update(
      () => {
        const cacheNode = $getRoot().getChildren().find($isCacheNode);
        if (cacheNode) {
          cacheNode.setData(cacheData);
        }
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );
  }

  // Initialize all widget nested editors so walkNodeWithWidgets can traverse into them.
  // Without this, WidgetNode.editor is null after JSON deserialization and
  // any DataFetchingNode inside a widget would be unreachable.
  //
  // When editorStateString is provided (editor mode), the CacheNode already
  // contains widget_{ID}_editor_state keys from the client editor's
  // processAllWidgets run. We can use processAllWidgetsSync to avoid
  // redundant server fetches for each widget template.
  //
  // When no editorStateString is provided (reader/server mode), the editor
  // state comes from the DB and has no cached widget data, so we must use
  // processAllWidgets (async) to fetch each widget's template from the server.
  if (editorStateString && cacheData) {
    processAllWidgetsSync(editor);
  } else {
    await processAllWidgets(editor);
  }

  let dataFetchingNode: DataFetchingNode | null = null;
  let targetNestedEditor: LexicalEditor | null = null;

  walkNodeWithWidgets(editor, (nestedEditor, node) => {
    if (
      $isDataFetchingNode(node) &&
      node.getName() === dataName &&
      // Only set the first match to ensure we target the correct node
      // in case of multiple nodes with the same name
      dataFetchingNode === null
    ) {
      dataFetchingNode = node;
      targetNestedEditor = nestedEditor;
    }
  });

  if (!dataFetchingNode || !targetNestedEditor) {
    return createResponsePayload({
      success: false,
      error: `Data fetching node with name "${dataName}" not found`,
    });
  }

  const foundLexicalEditor = targetNestedEditor as LexicalEditor;

  // Set query parameters
  //editor.update(
  foundLexicalEditor.update(
    () => {
      const writable = dataFetchingNode!.getWritable();
      writable.setQuery(query || {});
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  const node = foundLexicalEditor.read(() =>
    (dataFetchingNode as DataFetchingNode).getLatest()
  );

  const serverActions = getEditorServerActionsUtils();

  try {
    const [result, pagination] = await fetchDataFetchingNode(
      node,
      foundLexicalEditor,
      serverActions,
      {
        useCacheIfExists: false,
      }
    );

    return handleResponse(wp, {
      data: result,
      info: pagination as DataFetchingPagination,
    });
  } catch (error) {
    logger.error( "Error fetching data fetching node:", error);
    return createResponsePayload({
      success: false,
      error: `Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};
