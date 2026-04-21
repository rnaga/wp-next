"use server";
import { z } from "zod";

import * as actionsMeta from "@rnaga/wp-next-core/server/actions/meta";
import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import * as actionsTerm from "@rnaga/wp-next-core/server/actions/term";
import {
  createResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import { logger } from "@rnaga/wp-next-core/server/utils/logger";
import { revalidateTag, unstable_cache } from "next/cache";

import { WP, getWPContext } from "@rnaga/wp-next-core/server/wp";

import {
  TEMPLATE_COLLECTION_POST_TYPE,
  TEMPLATE_POST_TYPE,
} from "../../lexical/constants";
import { TermsQuery } from "@rnaga/wp-node/query-builder";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type * as types from "../../types";
import {
  DEFAULT_TEMPLATE_JSON_STRING_CONTENT,
  TEMPLATE_DEFAULT_CONFIG,
  TEMPLATE_SLUGS_FORBIDDEN,
  TEMPLATE_META_CONFIG_KEY,
  TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY,
  TEMPLATE_META_PAGE_META_KEY,
  TEMPLATE_SLUGS_RESERVED,
} from "../../lexical/constants";

import { formatting } from "@rnaga/wp-node/common/formatting";

import {
  del as delEditorTerms,
  update as updateEditorTerms,
} from "./editor-terms";
import { isErrorSlug, isValidPageSlug } from "../../lexical/validate-slug";
import { auditServerDom } from "../setup-dom";
import { $getRoot, createEditor, HISTORY_MERGE_TAG } from "lexical";
import { createLexicalEditor } from "../../lexical";
import { $createErrorDataFetchingNode } from "../../lexical/nodes/error-data-fetching/ErrorDataFetchingNode";
import { deleteAllPreviews, savePreview } from "./preview";
import { checkPermission } from "./check-permission";

// Checks whether a template with the given name already exists.
// Used by `create` and `update` to enforce unique template names, since
// templates are identified by name in the UI and duplicate names would
// make it impossible for users to distinguish between them.
// `templateId` is excluded from the search so `update` doesn't false-positive
// on the template being updated itself.
export const exists = async (name: string, templateId?: number) => {
  const existingTemplates =
    (
      await actionsPost
        .list(
          { search: name, exclude: templateId ? [templateId] : [] },
          { postTypes: [TEMPLATE_POST_TYPE] }
        )
        .then(({ data: templates }) =>
          templates.filter((template) => template.post_title === name)
        )
    ).length > 0;

  return existingTemplates;
};

const getPageSlugAlias = async (alias: string) => {
  const wp = await WP();

  // TODO: This manual join should be handled by wp-node directly.
  // Ideally wp-node's TermsQuery or crud.term.list should support returning
  // object_id (the linked post ID) when querying by slug, without requiring
  // callers to hand-roll the posts ↔ term_relationships ↔ term_taxonomy ↔ terms
  // join chain. Until that is supported upstream, we build the query manually.
  const terms = await wp.utils.query.posts((query, builders) => {
    const termsQuery = builders.get(TermsQuery, query.builder, query.alias);
    const { column } = query.alias;

    query.from.builder
      .__ref(termsQuery)
      .joinTermRelationships(column("posts", "ID"))
      .joinTermTaxonomy()
      .joinTerms()
      .where("taxonomy", "page-slug-alias")
      .where("slug", alias)
      .builder.__ref(query)
      .where("post_type", TEMPLATE_POST_TYPE)
      .builder.limit(1);
  });

  if (!terms || terms.length === 0) {
    return null;
  }

  return {
    object_id: terms[0].ID,
    slug: alias,
  };
};

const getTemplateByPageSlugAlias = async (alias: string) => {
  const wp = await WP();
  const pageAlias = await getPageSlugAlias(alias);

  if (!pageAlias) {
    return null;
  }
  const aliasTemplateId = pageAlias.object_id;
  const templates = await wp.utils.query.posts((query) => {
    query.where("post_type", TEMPLATE_POST_TYPE);
    query.where("ID", aliasTemplateId);
    query.builder.limit(1);
  });

  return templates && templates.length > 0 ? templates[0] : null;
};

// Retrieves the template_config meta for a given template.
// template_config contains path/query mapping rules that control how URL
// params are parsed when the template is rendered as a page (see WPPage).
// Mapping items may carry a `required:true` flag — when set, missing that
// URL segment or query key causes a 404 on public pages (non-admin routes).
// The required flag is ignored on admin/preview pages.
//
// IMPORTANT: Must NOT be exposed as a public API endpoint.
// template_config can contain internal routing rules and parameter mappings
// that reveal the site's URL structure. Exposing it publicly would leak
// implementation details. Only call this server-side (e.g. from WPPage).
export const getTemplateWithConfig = async (
  templateIdOrSlug: number | string
) => {
  const wp = await WP();

  //let templateId = 0;

  let templates = await wp.utils.query.posts((query) => {
    query.where("post_type", TEMPLATE_POST_TYPE);
    if (typeof templateIdOrSlug === "string") {
      query.where("post_name", templateIdOrSlug);
    } else {
      query.where("ID", templateIdOrSlug);
    }

    query.builder.limit(1);
  });

  // If template is not found, try to search from page alias terms
  if (
    !templates ||
    (templates.length === 0 && typeof templateIdOrSlug === "string")
  ) {
    const template = await getTemplateByPageSlugAlias(
      templateIdOrSlug as string
    );

    if (template) {
      templates = [template];
    }
  }

  if (!templates || templates.length === 0) {
    throw new Error("Template not found");
  }

  const templateId = templates[0].ID;

  const config = await wp.utils.meta.getValue<types.TemplateConfig>(
    "post",
    templateId,
    TEMPLATE_META_CONFIG_KEY
  );

  const useWidgetOnly = await wp.utils.meta.getValue<number>(
    "post",
    templateId,
    TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY
  );

  const pageMeta = await wp.utils.meta.getValue<types.TemplatePageMeta>(
    "post",
    templateId,
    TEMPLATE_META_PAGE_META_KEY
  );

  const mergedConfig: types.TemplateConfig = {
    ...(config ?? { pathMapping: [], queryMapping: {} }),
    useWidgetOnly: useWidgetOnly === 1,
  };

  return { template: templates[0], config: mergedConfig, pageMeta };
};

// Fetches a single template by ID or slug, including its template_config meta.
// Used by the editor to load template content for editing, and by WidgetNode
// to resolve embedded widget templates at render time.
//
// IMPORTANT: Internal use only — do NOT expose as a public API endpoint.
// The response includes template_config which contains internal routing rules.
// If a public endpoint is ever needed, strip template_config from the response.
export const get = async (
  templateIdOrSlug: number | string
): Promise<
  wpCoreTypes.actions.ReponsePayload<{
    data: wpTypes.crud.CrudReturnType<"post", "get">["data"] & {
      template_config: types.TemplateConfig | undefined;
      page_meta: types.TemplatePageMeta | undefined;
    };
    info: wpTypes.crud.CrudReturnType<"post", "get">["info"];
  }>
> => {
  const wp = await WP();

  let postData: Awaited<ReturnType<typeof wp.utils.crud.post.get>>["data"];
  let postInfo: Awaited<ReturnType<typeof wp.utils.crud.post.get>>["info"];

  try {
    // Primary lookup: fetch by numeric ID or post_name (slug).
    // Falls back to page-slug-alias lookup when the primary lookup throws
    // (e.g. a string that isn't a valid post_name but is a registered alias).
    let result = await wp.utils.crud.post
      .get(templateIdOrSlug, {
        context: "view",
        postType: TEMPLATE_POST_TYPE,
      })
      .catch(async () => {
        if (typeof templateIdOrSlug !== "string") {
          return undefined;
        }
        // Primary lookup failed — try resolving via page slug alias term.
        const aliasTemplate = await getTemplateByPageSlugAlias(
          templateIdOrSlug as string
        );

        if (!aliasTemplate) {
          return undefined;
        }

        return wp.utils.crud.post.get(aliasTemplate.ID, {
          context: "view",
          postType: TEMPLATE_POST_TYPE,
        });
      });

    if (!result) {
      return createResponsePayload({
        success: false,
        error: "Template not found",
      });
    }

    postData = result.data;
    postInfo = result.info;

    const { config, pageMeta } = await getTemplateWithConfig(postData.ID);

    return createResponsePayload({
      success: true,
      error: undefined,
      data: {
        ...postData,
        post_content: postData.post_content ?? "",
        // Remove template_config before returning if exposing as API
        template_config: config,
        page_meta: pageMeta,
      },
      info: postInfo,
    });
  } catch (error) {
    logger.error("Error fetching template:", error);
    return createResponsePayload({
      success: false,
      error: `Failed to fetch template: ${error}`,
    });
  }
};

type ListTemplates<T extends boolean> = T extends true
  ? Array<{
      withContent: true;
      ID: number;
      post_title: string;
      post_name: string;
      post_status: string;
      post_type: string;
      menu_order: number;
      post_content: string;
      useWidgetOnly: boolean;
    }>
  : Array<{
      withContent: false;
      ID: number;
      post_title: string;
      post_name: string;
      post_status: string;
      post_type: string;
      menu_order: number;
      post_content: never;
      useWidgetOnly: boolean;
    }>;

const listTemplates = async <T extends boolean>(args: {
  withContent: T;
  postTypes: Array<
    typeof TEMPLATE_POST_TYPE | typeof TEMPLATE_COLLECTION_POST_TYPE
  >;
  parentId?: number;
  search?: string;
  include?: number[];
  perPage?: number;
  checkParent?: boolean;
  orderBy?: "ID" | "post_title" | "menu_order";
  descending?: boolean;
}) => {
  const wp = await WP();
  const {
    withContent = false,
    postTypes,
    parentId = 0,
    search,
    include,
    perPage,
    checkParent = true,
    orderBy = "menu_order",
    descending = false,
  } = args || {};

  const templates = await wp.utils.query.posts(
    (query) => {
      const { column } = query.alias;
      query.where("post_type", postTypes);

      // Dont check parent if search term is present.
      // Or if checkParent is true.
      if (!search && checkParent) {
        query.where("post_parent", parentId);
      }

      query.builder.orderBy(
        column("posts", orderBy),
        descending ? "desc" : "asc"
      );

      if (search) {
        query.whereLike("post_title", search);
      }

      if (include) {
        query.whereIn("ID", include);
      }

      const select: (keyof wpTypes.WpPosts)[] = [
        "ID",
        "menu_order",
        "post_title",
        "post_name",
        "post_status",
        "post_type",
      ];

      if (withContent) {
        select.push("post_content");
      }
      query.select(select);

      if (perPage) {
        query.builder.limit(perPage);
      }
    },
    z.array(
      z.object({
        ID: z.number(),
        post_title: z.string(),
        post_name: z.string(),
        post_status: z.string(),
        post_type: z.string(),
        menu_order: z.number(),
        post_content: z.string().optional(),
      })
    )
  );

  const templateIds = templates?.map((template) => template.ID) ?? [];

  // TODO: Optimize by combining the meta queries with the main query using joins,
  // instead of doing separate queries for each template. This would require wp-node to support joining postmeta when querying posts.
  const useWidgetOnlyMeta =
    templateIds.length > 0
      ? ((await wp.utils.query.meta(
          "post",
          (query) => {
            query.withIds(templateIds);
            query.where(TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY, 1);
            query.builder.select(["post_id"]);
          },
          z.array(
            z.object({
              post_id: z.number(),
            })
          )
        )) ?? [])
      : [];

  const templatesWithWidgetOnly =
    templates?.map((template) => {
      const useWidgetOnly = useWidgetOnlyMeta.find(
        (meta) => meta.post_id === template.ID
      )
        ? true
        : false;
      return {
        ...template,
        useWidgetOnly,
      };
    }) ?? [];

  return templatesWithWidgetOnly as ListTemplates<T> | undefined;
};

export const list = async (args?: {
  search?: string;
  include?: number[];
  perPage?: number;
  checkParent?: boolean;
}) => {
  const wp = await WP();

  const templates = await listTemplates({
    withContent: false,
    search: args?.search,
    include: args?.include,
    perPage: args?.perPage,
    checkParent: args?.checkParent ?? true,
    postTypes: [TEMPLATE_POST_TYPE],
    orderBy: "ID",
    descending: true,
  });

  return createResponsePayload({
    success: true,
    data: templates,
  });
};

export const listWithCollection = async () => {
  const wp = await WP();

  type PostWithCollection = types.Templates[number] & {
    isCollection: boolean;
    children?: types.Templates;
  };

  const result: PostWithCollection[] = [];

  // First, get all collections (post_parent = 0) with their child templates
  const collections =
    (await listTemplates({
      withContent: false,
      postTypes: [TEMPLATE_COLLECTION_POST_TYPE],
    })) ?? [];

  for (const collection of collections) {
    const children =
      (await listTemplates({
        withContent: false,
        postTypes: [TEMPLATE_POST_TYPE],
        parentId: collection.ID,
      })) ?? [];

    result.push({
      ...collection,
      isCollection: true,
      children,
    });
  }

  // Then, append standalone templates (post_parent = 0)
  const standaloneTemplates =
    (await listTemplates({
      withContent: false,
      postTypes: [TEMPLATE_POST_TYPE],
    })) ?? [];

  for (const template of standaloneTemplates) {
    result.push({
      ...template,
      isCollection: false,
    });
  }

  return createResponsePayload({
    success: true,
    data: result,
  });
};

export const create = async (
  name: string,
  slug?: string,
  options?: {
    collectionId?: number;
  }
) => {
  const wp = await WP();
  const user = wp.current.user;
  const userId = user?.props?.ID;

  const formattedSlug = slug ? formatting.slug(slug) : formatting.slug(name);

  if (!isValidPageSlug(formattedSlug)) {
    return createResponsePayload({
      success: false,
      error: `The slug "${formattedSlug}" is invalid. Slugs must start with a letter or number and contain only lowercase letters, numbers, hyphens, or underscores.`,
    });
  }

  // Throw error if slug is forbidden
  if (TEMPLATE_SLUGS_FORBIDDEN.includes(formattedSlug)) {
    return createResponsePayload({
      success: false,
      error: `The slug "${formattedSlug}" cannot be used. Please choose a different slug.`,
    });
  }

  if (await exists(name)) {
    return createResponsePayload({
      success: false,
      error: "Template with the same name already exists",
    });
  }

  let editorStateString = DEFAULT_TEMPLATE_JSON_STRING_CONTENT;

  // If the new template's slug matches the error template slug, pre-attach an ErrorDataFetchingNode to the editor state.
  if (isErrorSlug(formattedSlug)) {
    auditServerDom();

    const editor = createLexicalEditor({ isHeadless: true, editable: false });
    editor.parseEditorState(editorStateString);

    editor.update(
      () => {
        const errorDataFetchingNode = $createErrorDataFetchingNode();
        $getRoot().append(errorDataFetchingNode);
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    editorStateString = JSON.stringify(editor.getEditorState());
  }

  const result = await actionsPost.create({
    post_title: name,
    post_name: formattedSlug,
    post_type: TEMPLATE_POST_TYPE,
    post_author: userId,
    post_status: "pending",
    post_content: editorStateString,
    post_parent: options?.collectionId ?? 0,
  });

  // Invalidate the shared Next.js Data Cache so the new template's slug is
  // included in subsequent calls to getPublishedSlugs across all workers.
  if (result.success) {
    logger.log(
      "Invalidating published slugs cache due to new template creation"
    );
    revalidateTag(PUBLISHED_SLUGS_CACHE_TAG, {});
  }

  if (!result.success) {
    return createResponsePayload({
      success: false,
      error: result.error || "Failed to create template",
      data: undefined,
    });
  }

  const templateId = result.data as number;

  // Set menu order to be 0 so that new templates appear at the top of the list. Users can reorder them as needed.
  await wp.utils.trx.post.updateMenuOrder(templateId, 0);

  // Initialize the first preview entry via the preview module
  await savePreview(templateId, editorStateString);

  return result;
};

// Update page slug alias associated with the template
export const updatePageSlugAlias = async (
  templateId: number,
  pageSlugAlias: string[]
) => {
  if (!(await checkPermission())) {
    return false;
  }

  // Convert pageSlugAlias to slug format (lowercase, hyphens instead of spaces)
  const formattedAlias = pageSlugAlias.map((alias) => formatting.slug(alias));

  // Throw error if any alias already exists for another template
  for (const alias of formattedAlias) {
    if (!isValidPageSlug(alias)) {
      return createResponsePayload({
        success: false,
        error: `The page slug alias "${alias}" is invalid. Slugs must start with a letter or number and contain only lowercase letters, numbers, hyphens, or underscores.`,
      });
    }

    if (
      TEMPLATE_SLUGS_FORBIDDEN.includes(alias) ||
      TEMPLATE_SLUGS_RESERVED.includes(alias)
    ) {
      return createResponsePayload({
        success: false,
        error: `The page slug alias "${alias}" cannot be used. Please choose a different alias.`,
      });
    }

    const existingAlias = await getPageSlugAlias(alias);
    if (existingAlias && existingAlias.object_id !== templateId) {
      return createResponsePayload({
        success: false,
        error: "Page slug alias already exists for another template",
      });
    }
  }

  return updateEditorTerms(templateId, formattedAlias, "page-slug-alias");
};

// Returns true if the given page slug alias is already in use by any template.
// Pass `excludeTemplateId` to exclude a specific template from the check
// (e.g. when validating an alias for an existing template being updated).
export const pageSlugAliasExists = async (
  alias: string,
  excludeTemplateId?: number
): Promise<boolean> => {
  if (!(await checkPermission())) {
    return false;
  }

  const result = await getPageSlugAlias(alias);
  if (!result) return false;
  if (excludeTemplateId !== undefined && result.object_id === excludeTemplateId)
    return false;
  return true;
};

// Returns the list of page slug aliases associated with a template.
export const getPageSlugAliases = async (
  templateId: number
): Promise<string[]> => {
  if (!(await checkPermission())) {
    return [];
  }

  const result = await actionsTerm.list(
    "page-slug-alias",
    { post: templateId },
    { context: "edit" }
  );

  return result.data.map((term) => term.slug);
};

export const updateVisibility = async (
  templateId: number,
  isPublic: boolean
) => {
  const wp = await WP();

  const newStatus = isPublic ? "publish" : "pending";

  const result = await actionsPost.update(templateId, {
    post_status: newStatus,
  });

  // Invalidate the shared Next.js Data Cache so the visibility change is
  // reflected in subsequent calls to getPublishedSlugs across all workers.
  if (result.success) {
    logger.log(
      "Invalidating published slugs cache due to template visibility update"
    );
    revalidateTag(PUBLISHED_SLUGS_CACHE_TAG, {});
  }

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: result.data,
  });
};

const PUBLISHED_SLUGS_CACHE_TAG = "published-slugs";

// Whether to cache published slugs. Disable for local debugging.
// Env: WP_NEXT_EDITOR_SLUG_CACHE_ENABLED — "false" to disable, anything else (or unset) enables. Default: true.
const SLUG_CACHE_ENABLED =
  process.env.WP_NEXT_EDITOR_SLUG_CACHE_ENABLED !== "false";

// How long (in seconds) the cache lives before Next.js revalidates in the background.
// Env: WP_NEXT_EDITOR_SLUG_CACHE_TTL_MINUTES — integer minutes. Default: 3.
const SLUG_CACHE_TTL_SECONDS =
  parseInt(process.env.WP_NEXT_EDITOR_SLUG_CACHE_TTL_MINUTES ?? "3", 10) * 60;

/**
 * Queries published template slugs (and their aliases) from the DB.
 * Does not require authentication — published post data is public.
 * getWPContext() is used instead of WP() because WP() calls headers()
 * via the next_core_init hook, which Next.js forbids inside cache scopes.
 */
const queryPublishedSlugsFromDB = async () => {
  const wp = await getWPContext();

  const result = await wp.utils.query.posts((query) => {
    query.where("post_type", TEMPLATE_POST_TYPE);
    query.where("post_status", "publish");

    // Must exclude templates with useWidgetOnly = true,
    // since those templates are not rendered as pages and their slugs should not be publicly accessible.
    query.withoutMeta(TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY, "1");
    query.builder.limit(999);
  });

  const slugs = result ? result.map((post) => post.post_name) : [];

  logger.debug(
    `Fetched ${slugs.length} published slugs from the database`,
    slugs
  );

  // Collect slug aliases for all published templates in a single query.
  const publishedIds = result ? result.map((post) => post.ID) : [];

  if (publishedIds.length > 0) {
    const aliasTerms = await wp.utils.query.terms((query) => {
      query.where("taxonomy", "page-slug-alias").withObjectIds(publishedIds);
    });

    if (aliasTerms) {
      for (const term of aliasTerms) {
        slugs.push(term.slug);
      }
    }
  }

  return slugs;
};

/**
 * Fetches published template slugs, optionally from Next.js's shared Data
 * Cache (filesystem-backed at .next/cache/, visible to all worker processes).
 * Caching is controlled by WP_NEXT_EDITOR_SLUG_CACHE_ENABLED and WP_NEXT_EDITOR_SLUG_CACHE_TTL_MINUTES.
 * Invalidated via revalidateTag whenever a template's visibility changes.
 */
const fetchPublishedSlugsFromDB = SLUG_CACHE_ENABLED
  ? unstable_cache(queryPublishedSlugsFromDB, [PUBLISHED_SLUGS_CACHE_TAG], {
      tags: [PUBLISHED_SLUGS_CACHE_TAG],
      revalidate: SLUG_CACHE_TTL_SECONDS,
    })
  : queryPublishedSlugsFromDB;

export const getPublishedSlugs = async () => {
  const slugs = await fetchPublishedSlugsFromDB();
  return createResponsePayload({ success: true, data: slugs });
};

export const update = async (
  templateId: number,
  name: string,
  options: {
    slug?: string;
    status?: wpTypes.WpPosts["post_status"];
    config: types.TemplateConfig;
    pageMeta?: types.TemplatePageMeta;
    pageSlugAlias?: string[];
  }
) => {
  const wp = await WP();

  if (options.slug && !isValidPageSlug(options.slug)) {
    return createResponsePayload({
      success: false,
      error: `The slug "${options.slug}" is invalid. Slugs must start with a letter or number and contain only lowercase letters, numbers, hyphens, or underscores.`,
    });
  }

  if (await exists(name, templateId)) {
    return createResponsePayload({
      success: false,
      error: "Template with the same name already exists",
    });
  }

  // Get the current template before updating.
  const currentTemplateResult = await wp.utils.crud.post.get(templateId, {
    postType: TEMPLATE_POST_TYPE,
  });

  if (!currentTemplateResult || !currentTemplateResult.data) {
    return createResponsePayload({
      success: false,
      error: "Failed to fetch current template data",
    });
  }

  // Check if the template is an error template and if the slug is being changed to or from an error slug.
  const currentTemplate = currentTemplateResult.data;
  const isCurrentlyErrorTemplate = isErrorSlug(currentTemplate.post_name);

  // Dont allow changing slug of an error template to a non-error slug, or vice versa, since that would require adding/removing the ErrorDataFetchingNode from the editorState, which is a complex operation that could lead to data loss if not handled perfectly. Enforce that error templates always have error slugs, and non-error templates always have non-error slugs.
  if (
    (isCurrentlyErrorTemplate && options.slug && !isErrorSlug(options.slug)) ||
    (!isCurrentlyErrorTemplate && options.slug && isErrorSlug(options.slug))
  ) {
    return createResponsePayload({
      success: false,
      error: "Cannot change slug to or from an error slug",
    });
  }

  const result = await actionsPost.update(templateId, {
    post_title: name,
    post_status: options.status || "pending",
    ...(options.slug ? { post_name: options.slug } : {}),
  });

  // Update meta separately as core crud won't allow private meta update
  const { useWidgetOnly, ...configWithoutWidgetOnly } = options.config;
  await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    TEMPLATE_META_CONFIG_KEY,
    JSON.stringify(configWithoutWidgetOnly)
  );

  await wp.utils.trx.meta.upsert(
    "post",
    templateId,
    TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY,
    useWidgetOnly ? "1" : "0"
  );

  if (options.pageMeta) {
    await wp.utils.trx.meta.upsert(
      "post",
      templateId,
      TEMPLATE_META_PAGE_META_KEY,
      JSON.stringify(options.pageMeta)
    );
  }

  // Skip alias for error templates — they are always standalone pages, so slug aliases are irrelevant.
  if (options.pageSlugAlias && !isErrorSlug(name)) {
    const aliasResult = await updatePageSlugAlias(
      templateId,
      options.pageSlugAlias
    );

    if (aliasResult && !aliasResult.success) {
      return createResponsePayload({
        success: false,
        error: aliasResult.error,
      });
    }
  }

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: result.data,
  });
};

export const changeOrder = async (
  templateId: number,
  newOrder: number,
  postType: typeof TEMPLATE_POST_TYPE | typeof TEMPLATE_COLLECTION_POST_TYPE
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to change template order",
      data: undefined,
    });
  }

  const result = await wp.utils.trx.post.updateMenuOrder(templateId, newOrder, {
    postTypes: [postType],
  });

  return createResponsePayload({
    success: result,
    data: {},
  });
};

export const swapOrder = async (
  templateId1: number,
  templateId2: number,
  postType: typeof TEMPLATE_POST_TYPE | typeof TEMPLATE_COLLECTION_POST_TYPE
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to swap template orders",
      data: undefined,
    });
  }

  const result = await wp.utils.trx.post.swapMenuOrder(
    templateId1,
    templateId2,
    {
      postTypes: [postType],
    }
  );

  return createResponsePayload({
    success: result,
    data: {},
  });
};

export const deleteTemplateConfig = async (templateId: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to delete config",
      data: undefined,
    });
  }

  const { data } = await actionsMeta.list("post", {
    include: [templateId],
    search: `${TEMPLATE_META_CONFIG_KEY}`,
    orderby: "meta_id",
    order: "desc",
    per_page: 1,
  });

  //const meta = await wp.utils.meta.
  if (!data || data.length === 0) {
    return createResponsePayload({
      success: false,
      error: "No template config found to delete",
      data: undefined,
    });
  }

  const metaId = (data[0] as any).meta_id;

  await wp.utils.trx.meta.removeByIds("post", templateId, [metaId]);
};

export const duplicate = async (templateId: number) => {
  const wp = await WP();

  const result = await actionsPost.copy(templateId);

  // Delete preview metas (e.g. preview history) from duplicated template
  // because newly duplicated template would not need old previews
  if (result.success) {
    const duplicatedTemplateId = result.data as number;

    const metas = await wp.utils.query.meta(
      "post",
      (query) => {
        query.withIds([duplicatedTemplateId]);
      },
      z.array(
        z.object({
          meta_id: z.number(),
        })
      )
    );

    const metaIds = metas?.map((meta) => meta.meta_id) ?? [];
    if (metaIds.length > 0) {
      await wp.utils.trx.meta.removeByIds(
        "post",
        duplicatedTemplateId,
        metaIds
      );
    }
  }

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: result.data,
  });
};

export const del = async (templateId: number) => {
  const wp = await WP();
  return handleResponse(wp, actionsPost.del(templateId));
};

export const listCollection = async () => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to list template collections",
      data: undefined,
    });
  }

  const collections = await listTemplates({
    withContent: false,
    postTypes: [TEMPLATE_COLLECTION_POST_TYPE],
  });

  return createResponsePayload({
    success: true,
    data: collections,
  });
};

export const collectionExists = async (name: string, collectionId?: number) => {
  const existingTemplates =
    (
      await actionsPost
        .list(
          { search: name, exclude: collectionId ? [collectionId] : [] },
          { postTypes: [TEMPLATE_COLLECTION_POST_TYPE] }
        )
        .then(({ data: templates }) =>
          templates.filter((template) => template.post_title === name)
        )
    ).length > 0;

  return existingTemplates;
};

export const createCollection = async (name: string) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to create template collection",
      data: undefined,
    });
  }

  const formattedSlug = formatting.slug(name);

  if (await collectionExists(name)) {
    return createResponsePayload({
      success: false,
      error: "Template collection with the same name already exists",
      data: undefined,
    });
  }

  const result = await actionsPost.create({
    post_title: name,
    post_name: formattedSlug,
    post_type: TEMPLATE_COLLECTION_POST_TYPE,
    post_status: "publish",
  });

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: result.data,
  });
};

export const updateCollection = async (collectionId: number, name: string) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to update template collection",
      data: undefined,
    });
  }

  if (await collectionExists(name, collectionId)) {
    return createResponsePayload({
      success: false,
      error: "Template collection with the same name already exists",
      data: undefined,
    });
  }

  const result = await actionsPost.update(collectionId, {
    post_title: name,
  });

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: result.data,
  });
};

export const deleteCollection = async (
  collectionId: number,
  options?: {
    deleteTemplates?: boolean;
    inheritCollectionId?: number;
  }
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to delete template collection",
      data: undefined,
    });
  }

  // Get all templates in the collection.
  const templates =
    (await wp.utils.query.posts((query) => {
      query.where("post_type", TEMPLATE_POST_TYPE);
      query.where("post_parent", collectionId);
      query.builder.limit(999);
    })) ?? [];

  for (const template of templates) {
    if (options?.deleteTemplates) {
      await del(template.ID);
    } else {
      // Move templates to inheritCollectionId if provided, otherwise set to 0
      await actionsPost.update(template.ID, {
        post_parent: options?.inheritCollectionId ?? 0,
      });
    }
  }

  // Delete the collection post itself
  await actionsPost.del(collectionId);

  return createResponsePayload({
    success: true,
    data: undefined,
  });
};

export const moveToCollection = async (
  templateId: number,
  collectionId: number | null
) => {
  const wp = await WP();
  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to move template",
      data: undefined,
    });
  }

  const result = await actionsPost.update(templateId, {
    post_parent: collectionId ?? 0,
  });

  // Set menu order to be 0 so that moved templates appear
  // at the top of the list in the new collection.
  await wp.utils.trx.post.updateMenuOrder(templateId, 0, {
    reOrder: true,
  });

  return createResponsePayload({
    success: result.success,
    error: result.error,
    data: undefined,
  });
};
