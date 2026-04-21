"use server";
import * as actionsMeta from "@rnaga/wp-next-core/server/actions/meta";
import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import * as actionsCustomCode from "./custom-code";
import {
  createResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import { logger } from "@rnaga/wp-next-core/server/utils/logger";
import { WP } from "@rnaga/wp-next-core/server/wp";

import {
  TEMPLATE_META_PREVIEW_CONTENT_KEY_PREFIX,
  TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX,
  TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX,
  TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX,
} from "../../lexical/constants";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../types";

import { get as getTemplate } from "./template";

// Shared permission guard for all preview operations.
// WordPress templates are stored as custom post types, so we require the
// `edit_posts` capability to prevent unauthenticated or low-privilege users
// from reading/writing preview meta.
const checkPermission = async () => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user || !(await user.can(`edit_posts`))) {
    return false;
  }

  return true;
};

// Builds the metadata payload stored alongside each preview snapshot.
// This info is displayed in the preview history UI so users can see who
// saved each version and when.
const generatePreviewInfoJson = (
  name: string,
  options?: { description?: string; published?: boolean }
) => {
  return {
    createdBy: name || "Unknown",
    createdAt: new Date().toISOString(),
    ...(options?.description ? { description: options.description } : {}),
    ...(options?.published ? { published: options.published } : {}),
  } satisfies types.TemplatePreviewInfo["metaValue"];
};

// Generates a unique pair of meta keys for a new manual preview snapshot.
// The timestamp suffix ensures each "Save Preview" action creates a distinct
// entry, allowing the system to maintain a chronological history of up to
// MAX_PREVIEW_COUNT versions that users can browse and restore from.
const generatePreviewKeys = () => {
  const timestamp = Date.now();
  return {
    editorStateKey: `${TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX}_${timestamp}`,
    infoKey: `${TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX}_${timestamp}`,
  };
};

// Returns (or lazily creates) a site-wide random suffix stored in the
// `_template_auto_save_suffix` wp_option (e.g. "y41pe6").
// The suffix is appended to every auto-save meta key so that all users share
// the same generation:
//   _preview_content_autosave_{userId}_{suffix}
//   _preview_info_autosave_{userId}_{suffix}
//
// TODO: A future "toggle auto-save" setting will allow users to enable or
// disable auto-save previews. When auto-save is turned off, the suffix can
// be rotated (update the wp_option to a new value) to invalidate all
// existing auto-save entries — they become orphaned and are simply ignored,
// so no bulk deletion is needed.
const getAutoSaveKeySuffix = async () => {
  const wp = await WP();
  const optionKey = "_template_auto_save_suffix";

  let optionResult = await wp.utils.query.options((query) => {
    query.get(optionKey);
  });

  if (!optionResult) {
    const newSuffix = Math.random().toString(36).substring(2, 8);
    const result = await wp.utils.trx.options.insert(optionKey, newSuffix, {
      upsert: true,
    });
    if (!result) {
      throw new Error("Failed to generate auto-save preview keys");
    }

    // Now get the newly created suffix
    optionResult = await wp.utils.query.options((query) => {
      query.get(optionKey);
    });
  }

  if (
    !optionResult ||
    !optionResult.option_name ||
    !optionResult.option_value
  ) {
    throw new Error(
      "Invalid option result for auto-save preview keys generation"
    );
  }
  return optionResult.option_value;
};

const generateAutoSavePreviewKeys = async (userId: number) => {
  const suffix = await getAutoSaveKeySuffix();

  return {
    editorStateKey: `${TEMPLATE_META_PREVIEW_CONTENT_KEY_PREFIX}_autosave_${userId}_${suffix}`,
    infoKey: `${TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX}_autosave_${userId}_${suffix}`,
  };
};

/**
 * Template Preview Management Endpoints
 *
 * Overview:
 * These endpoints manage template preview functionality, allowing users to save, retrieve,
 * and manage multiple preview versions of templates. Previews are stored as WordPress post meta.
 *
 * Architecture:
 * - Each preview consists of TWO meta entries:
 *   1. Content meta: Stores the actual editor state (Lexical JSON string)
 *   2. Info meta: Stores metadata (creator name, timestamp)
 *
 * - Meta keys use timestamp-based suffixes for uniqueness:
 *   - Content: `${TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX}_${timestamp}`
 *   - Info: `${TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX}_${timestamp}`
 *
 * - Previews are stored in chronological order and limited to MAX_PREVIEW_COUNT (configurable via environment variable, default 30)
 * - Older previews are automatically cleaned up when the limit is exceeded
 *
 * Permissions:
 * - All preview operations require the user to have 'edit_posts' capability
 */
export const getPreviewInfoList = async (
  templateId: number,
  options?: {
    autoSave?: boolean;
  }
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to view preview info",
      data: undefined,
    });
  }

  let searchKey = `${TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX}_%`;
  const userId = wp.current.user?.props?.ID;

  if (options?.autoSave && userId) {
    const { infoKey } = await generateAutoSavePreviewKeys(userId);
    if (!infoKey) {
      throw new Error("Failed to generate auto-save preview info key");
    }
    searchKey = infoKey;
  }

  const { data } = await actionsMeta.list("post", {
    include: [templateId],
    search: searchKey,
    orderby: "meta_id",
    order: "desc",
    per_page: 10000, // Get all previews without pagination (we'll handle limiting in code)
  });

  // meta_value is stored as JSON string, parse it
  const parsedData: types.TemplatePreviewInfoList = data.map((meta) => {
    const metaId = (meta as wpTypes.WpPostMeta).meta_id;

    try {
      const parsedValue = JSON.parse(String(meta.meta_value || "{}"));
      return {
        metaId: metaId,
        metaKey: meta.meta_key || "",
        metaValue: {
          createdAt: parsedValue.createdAt || "",
          createdBy: parsedValue.createdBy || "",
          ...(parsedValue.description
            ? { description: parsedValue.description }
            : {}),
          ...(parsedValue.published
            ? { published: parsedValue.published }
            : {}),
        },
      };
    } catch (error) {
      logger.error("Failed to parse preview info meta value:", error);
      return {
        metaId: metaId,
        metaKey: meta.meta_key || "",
        metaValue: {
          createdAt: "",
          createdBy: "",
        },
      };
    }
  });

  return createResponsePayload({
    success: true,
    error: undefined,
    data: parsedData,
  });
};

export const getPreviewInfo = async (templateId: number, infoKey: string) => {
  const previewInfoListResponse = await getPreviewInfoList(templateId);
  if (!previewInfoListResponse.success) {
    return createResponsePayload({
      success: false,
      error: `Failed to get preview info list ${previewInfoListResponse.error}`,
      data: undefined,
    });
  }

  const previewInfo = previewInfoListResponse.data.find(
    (info) => info.metaKey === infoKey
  );

  if (!previewInfo) {
    return createResponsePayload({
      success: false,
      error: "Preview info not found",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: previewInfo,
  });
};

export const getPreviewEditorStateList = async (templateId: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to view preview editor state",
      data: undefined,
    });
  }

  return handleResponse(
    wp,
    actionsMeta.list("post", {
      include: [templateId],
      search: `${TEMPLATE_META_PREVIEW_CONTENT_KEY_PREFIX}%`,
      orderby: "meta_id",
      order: "desc",
    })
  );
};

const getAutoSaveEditorState = async (templateId: number, userId: number) => {
  const { editorStateKey } = await generateAutoSavePreviewKeys(userId);

  const editorStateListResponse = await actionsMeta.list("post", {
    include: [templateId],
    search: editorStateKey,
    orderby: "meta_id",
    order: "desc",
    per_page: 1,
  });

  const editorStateList = editorStateListResponse.data || [];

  if (!Array.isArray(editorStateList) || editorStateList.length === 0) {
    return createResponsePayload({
      success: false,
      error: "No auto-save preview found",
      data: undefined,
    });
  }

  const autoSaveEditorStateString = String(editorStateList[0].meta_value);
  const autoSaveEditorStateMetaKey = editorStateList[0].meta_key;

  if (!autoSaveEditorStateString || !autoSaveEditorStateMetaKey) {
    return createResponsePayload({
      success: false,
      error: "Invalid auto-save preview data",
      data: undefined,
    });
  }

  const previewInfoResponse = await getPreviewInfoList(templateId, {
    autoSave: true,
  });

  if (
    !previewInfoResponse.success ||
    !Array.isArray(previewInfoResponse.data) ||
    0 === previewInfoResponse.data.length
  ) {
    return createResponsePayload({
      success: false,
      error: "Failed to get auto-save preview info",
      data: undefined,
    });
  }

  const previewInfo = previewInfoResponse.data[0];

  return createResponsePayload({
    success: true,
    error: undefined,
    data: {
      editorStateString: autoSaveEditorStateString,
      editorStateKey: autoSaveEditorStateMetaKey,
      previewInfo,
      infoKey: previewInfo.metaKey,
    },
  });
};

export const getLatestPreviewEditorState = async (
  templateId: number,
  options?: {
    enableAutoSave?: boolean;
  }
) => {
  const enableAutoSave = options?.enableAutoSave ?? true;

  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to view preview editor state",
      data: undefined,
    });
  }

  const userId = wp.current.user?.props?.ID;

  // First try to get auto-save preview if enabled and user is authenticated
  if (enableAutoSave && userId) {
    const autoSaveResult = await getAutoSaveEditorState(templateId, userId);
    if (autoSaveResult.success) {
      return autoSaveResult;
    }
  }

  const editorStateListResponse = await actionsMeta.list("post", {
    include: [templateId],
    search: `${TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX}_`,
    orderby: "meta_id",
    order: "desc",
    per_page: 1,
  });

  if (
    !Array.isArray(editorStateListResponse.data) ||
    editorStateListResponse.data.length === 0
  ) {
    // logger.warn( "Preview content not found, attempting fallback...");
    /**
     * Fallback Mechanism for Missing Preview Content
     *
     * This fallback handles scenarios where preview content doesn't exist yet:
     *
     * 1. Why this happens:
     *    - Newly created templates may not have preview content initially
     *    - Templates created before the preview system was implemented
     *    - Preview data was manually deleted or corrupted
     *
     * 2. Fallback strategy:
     *    a) Fetch the template's published content (post_content)
     *    b) Use this as the baseline for the first preview
     *    c) Save it as a new preview entry with current timestamp
     *    d) Return the content to the caller
     *
     * 3. Benefits:
     *    - Ensures users always have preview content to work with
     *    - Initializes the preview system automatically
     *    - Maintains backward compatibility with older templates
     *    - Creates a restore point from the published version
     *
     * 4. Side effects:
     *    - Automatically creates a new preview entry
     *    - Updates meta_input with new preview metadata
     *    - May trigger cleanup of old previews if MAX_PREVIEW_COUNT is exceeded
     */
    const templateResponse = await getTemplate(templateId);
    if (templateResponse.success) {
      const template = templateResponse.data;
      const editorStateString = template.post_content || "";

      // Initialize preview system by saving published content as first preview
      const {
        data: { infoKey, editorStateKey, previewInfo },
      } = await savePreview(templateId, editorStateString);

      return createResponsePayload({
        success: true,
        error: undefined,
        data: {
          editorStateString,
          editorStateKey,
          infoKey,
          previewInfo,
        },
      });
    }
  }

  const editorStateList = editorStateListResponse.data || [];

  if (
    editorStateList.length === 0 ||
    !editorStateList[0].meta_value ||
    !editorStateList[0].meta_key
  ) {
    return createResponsePayload({
      success: false,
      error: "No preview content found",
      data: undefined,
    });
  }

  // Return the latest preview content, which is the first item in the list.
  const latestEditorState = String(editorStateList[0].meta_value);
  const latestEditorStateMetaKey = editorStateList[0].meta_key;

  // Get previewInfo
  // First extract index from latestEditorStateMetaKey
  const indexMatch = latestEditorStateMetaKey.match(
    new RegExp(`^${TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX}_(\\d+)$`)
  );

  if (!indexMatch) {
    return createResponsePayload({
      success: false,
      error: "Invalid preview content key format",
      data: undefined,
    });
  }
  const index = indexMatch[1];
  const infoKey = `${TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX}_${index}`;

  const previewInfoListResponse = await getPreviewInfoList(templateId);
  if (!previewInfoListResponse.success) {
    return createResponsePayload({
      success: false,
      error: "Failed to get preview info list",
      data: undefined,
    });
  }

  const previewInfo = previewInfoListResponse.data.find(
    (info) => info.metaKey === infoKey
  );

  if (!previewInfo) {
    return createResponsePayload({
      success: false,
      error: "Preview info not found for the latest preview content",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: {
      editorStateKey: latestEditorStateMetaKey,
      editorStateString: latestEditorState,
      infoKey,
      previewInfo,
    },
  });
};

const MAX_PREVIEW_COUNT = process.env.MAX_PREVIEW_COUNT
  ? parseInt(process.env.MAX_PREVIEW_COUNT)
  : 30;

const cleanupOldPreviews = async (
  templateId: number,
  keepCount: number = MAX_PREVIEW_COUNT
) => {
  const wp = await WP();

  const infoListResponse = await getPreviewInfoList(templateId);
  if (!infoListResponse.success) {
    return;
  }

  const editorStateListResponse = await getPreviewEditorStateList(templateId);
  if (!editorStateListResponse.success) {
    return;
  }

  const infoList = infoListResponse.data || [];
  const editorStateList = editorStateListResponse.data || [];

  if (infoList.length <= keepCount) {
    // No need to cleanup since within limit
    return;
  }

  // Extract old previews to delete.
  // Note: Lists are ordered by meta_id descending (newest first).
  const infosToDelete = infoList.slice(keepCount);
  const editorStatesToDelete = editorStateList.slice(keepCount);

  // Delete old preview infos
  for (const info of infosToDelete) {
    const metaId = info.metaId;
    await wp.utils.trx.meta.removeByIds("post", templateId, [metaId]);
  }

  // Delete old preview contents
  for (const editorState of editorStatesToDelete) {
    const metaId = (editorState as wpTypes.WpPostMeta).meta_id;
    await wp.utils.trx.meta.removeByIds("post", templateId, [metaId]);
  }
};

export const deleteAllPreviews = async (templateId: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to delete previews",
      data: undefined,
    });
  }

  const metas = [];

  const infoListResponse = await getPreviewInfoList(templateId);
  infoListResponse.success &&
    infoListResponse.data &&
    metas.push(...infoListResponse.data);

  const editorStateListResponse = await getPreviewEditorStateList(templateId);
  editorStateListResponse.success &&
    editorStateListResponse.data &&
    metas.push(...editorStateListResponse.data);

  logger.log("Deleting all previews metas:", metas);
  for (const meta of metas) {
    const metaId = (meta as any).meta_id || (meta as any).metaId;
    await wp.utils.trx.meta.removeByIds("post", templateId, [metaId]);
  }
};

export const getPreviewEditorStateByInfoKey = async (
  templateId: number,
  infoKey: string
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to view preview content",
      data: undefined,
    });
  }

  // Determine if the infokey is for auto-save or manual preview based on its prefix
  const isAutoSave = infoKey.startsWith(
    `${TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX}_autosave_`
  );

  let editorStateKey = "";
  if (isAutoSave) {
    const useId = wp.current.user?.props?.ID;
    if (!useId) {
      return createResponsePayload({
        success: false,
        error: "User not authenticated for auto-save preview",
        data: undefined,
      });
    }
    // This is for auto-save preview, directly fetch the editor state using the infoKey
    const autoSaveKey = await generateAutoSavePreviewKeys(useId);

    editorStateKey = autoSaveKey.editorStateKey;
  } else {
    // Extract index from infoKey
    const indexMatch = infoKey.match(
      new RegExp(`^${TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX}_(\\d+)$`)
    );
    if (!indexMatch) {
      return createResponsePayload({
        success: false,
        error: "Invalid info key format",
        data: undefined,
      });
    }
    const index = indexMatch[1];

    editorStateKey = `${TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX}_${index}`;
  }

  if (!editorStateKey) {
    return createResponsePayload({
      success: false,
      error: "Failed to determine editor state key from info key",
      data: undefined,
    });
  }

  const editorStateListResponse = await actionsMeta.list("post", {
    per_page: 1,
    include: [templateId],
    search: editorStateKey,
  });

  if (!editorStateListResponse) {
    return createResponsePayload({
      success: false,
      error: "Failed to get preview content",
      data: undefined,
    });
  }

  const contentList = editorStateListResponse;

  if (contentList.data.length === 0 || !contentList.data[0].meta_value) {
    return createResponsePayload({
      success: false,
      error: "No preview content found for the given info key",
      data: undefined,
    });
  }

  const previewInfo = await getPreviewInfo(templateId, infoKey);
  if (!previewInfo.success) {
    return createResponsePayload({
      success: false,
      error: "Failed to get preview info for the given info key",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: {
      editorStateString: String(contentList.data[0].meta_value),
      previewInfo: previewInfo.data,
      editorStateKey,
    },
  });
};

export const autoSavePreview = async (
  templateId: number,
  editorStateString: string
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to save preview",
      data: undefined,
    });
  }

  const userId = wp.current.user?.props?.ID;
  if (!userId) {
    return createResponsePayload({
      success: false,
      error: "User not authenticated",
      data: undefined,
    });
  }

  const infoJson = generatePreviewInfoJson(
    wp.current.user?.props?.display_name || ""
  );

  const { editorStateKey, infoKey } = await generateAutoSavePreviewKeys(userId);

  // Save preview info. Note meta_key can be duplicated to keep history.
  const result = await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    infoKey,
    JSON.stringify(infoJson)
  );

  if (!result) {
    return createResponsePayload({
      success: false,
      error: "Failed to save preview info",
      data: undefined,
    });
  }

  // Save preview content (encode as base64)
  const resultContent = await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    editorStateKey,
    editorStateString,
    {
      unique: false,
      skipUnslash: true,
    }
  );

  if (!resultContent) {
    return createResponsePayload({
      success: false,
      error: "Failed to save preview content",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: true,
  });
};

export const savePreview = async (
  templateId: number,
  editorStateString: string,
  options?: {
    maxPreviewCount?: number;
    description?: string;
    published?: boolean;
  }
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to save preview",
      data: undefined,
    });
  }

  const infoJson = generatePreviewInfoJson(
    wp.current.user?.props?.display_name || "",
    { description: options?.description, published: options?.published }
  );

  let infoKey: string | undefined;
  let editorStateKey: string | undefined;

  let { editorStateKey: generatedEditorStateKey, infoKey: generatedInfoKey } =
    generatePreviewKeys();

  editorStateKey = generatedEditorStateKey;
  infoKey = generatedInfoKey;

  // Save preview info. Note meta_key can be duplicated to keep history.
  const result = await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    infoKey,
    JSON.stringify(infoJson)
  );

  if (!result) {
    return createResponsePayload({
      success: false,
      error: "Failed to save preview info",
      data: undefined,
    });
  }

  // Save preview content (encode as base64)
  const resultContent = await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    editorStateKey,
    editorStateString,
    {
      unique: false,
      skipUnslash: true,
    }
  );

  if (!resultContent) {
    return createResponsePayload({
      success: false,
      error: "Failed to save preview content",
      data: undefined,
    });
  }

  // Cleanup old previews
  await cleanupOldPreviews(
    templateId,
    options?.maxPreviewCount ?? MAX_PREVIEW_COUNT
  );

  // Now get the latest preview info to return
  const previewInfoResponse = await getPreviewInfo(templateId, infoKey);

  if (!previewInfoResponse.success) {
    return createResponsePayload({
      success: false,
      error: `Failed to get saved preview info ${previewInfoResponse.error}`,
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: {
      editorStateKey,
      infoKey,
      previewInfo: previewInfoResponse.data,
    },
  });
};

export const publishPreview = async (
  templateId: number,
  infoKeyOrEditorStateKey: string
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to publish preview",
      data: undefined,
    });
  }

  let editorStateString = "";

  logger.log(
    "Publishing preview for template:",
    templateId,
    infoKeyOrEditorStateKey,
    infoKeyOrEditorStateKey.startsWith(TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX)
  );

  // Determine if info key or content key is provided
  if (
    infoKeyOrEditorStateKey.startsWith(TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX)
  ) {
    // If info key is provided, get content by info key
    const editorStateStringResponse = await getPreviewEditorStateByInfoKey(
      templateId,
      infoKeyOrEditorStateKey
    );

    logger.log("Preview Content Response:", editorStateStringResponse);

    editorStateString = editorStateStringResponse.data.editorStateString;
  } else {
    // If content key is provided directly, get it from list
    const editorStateListResponse = await getPreviewEditorStateList(templateId);
    if (!editorStateListResponse.success) {
      return createResponsePayload({
        success: false,
        error: "Failed to get preview content for publishing",
        data: undefined,
      });
    }

    editorStateString = String(
      editorStateListResponse.data.find(
        (content) => content.meta_key === infoKeyOrEditorStateKey
      )?.meta_value
    );
  }

  if (0 === editorStateString.length) {
    return createResponsePayload({
      success: false,
      error: "Failed to get preview content for publishing",
      data: undefined,
    });
  }

  // Use skipUnslashFields to protect post_content from the wp-node transaction's
  // backslash-stripping behavior, which would otherwise corrupt JSON containing
  // escaped quotes (e.g. pipe params like {"format":"YYYY-MM-DD"}).
  const updateResponse = await actionsPost.update(
    templateId,
    {
      post_content: editorStateString,
    },
    {
      skipUnslashFields: ["post_content"],
    }
  );

  // Store custom code id in terms tables for tracking and cleanup.
  await actionsCustomCode.updateTermsByTemplateId(templateId);

  if (!updateResponse.success) {
    return createResponsePayload({
      success: false,
      error: "Failed to publish preview content to template",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: updateResponse.data,
  });
};
