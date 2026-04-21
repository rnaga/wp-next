"use server";
import { $getRoot, HISTORY_MERGE_TAG } from "lexical";

import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import {
  createResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import * as actionsTerm from "@rnaga/wp-next-core/server/actions/term";
import { WP } from "@rnaga/wp-next-core/server/wp";

import { $walkNode, createLexicalEditor } from "../../lexical";
import { registerNodeCreators } from "../../lexical/nodes";
import { $isCustomCodeNode } from "../../lexical/nodes/custom-code/CustomCodeNode";
import { processAllWidgets } from "../../lexical/nodes/widget/WidgetNode";
import { auditServerDom } from "../setup-dom";
import {
  append as appendEditorTerms,
  del as delEditorTerms,
  update as updateEditorTerms,
} from "./editor-terms";

import type * as wpTypes from "@rnaga/wp-node/types";

import type * as types from "../../types";
import { checkPermission } from "./check-permission";

export const get = async (id: number) => {
  const wp = await WP();
  const result = await actionsPost.list(
    {
      include: [id],
      per_page: 1,
    },
    {
      postTypes: ["next-custom-code"],
    }
  );

  const customCode = result.data[0];
  return handleResponse(wp, { data: customCode, info: undefined });
};

export const exists = async (name: string, templateId?: number) => {
  // Check if template with the same name exists
  const { data: existingTemplates } = await actionsPost.list(
    { search: name, exclude: templateId ? [templateId] : [] },
    { postTypes: ["next-custom-code"] }
  );

  return !!existingTemplates.find((template) => template.post_title === name);
};

export const create = async (args: {
  name: string;
  slug: string;
  content: string;
  mimeType: types.CustomCodeMimeType;
}) => {
  const wp = await WP();
  const { name, slug, content, mimeType } = args;

  const userId = wp.current.user?.props?.ID;

  if (!userId) {
    throw new Error("User not found");
  }

  if (await exists(name)) {
    throw new Error("Custom code with the same name already exists");
  }

  const result = await actionsPost.create({
    post_title: name,
    post_name: slug,
    post_type: "next-custom-code",
    post_author: userId,
    post_content: content,
    post_status: "publish",
    meta_input: {
      mime_type: mimeType,
    },
  });

  return handleResponse(wp, handleResponse(wp, result));
};

export const update = async (
  customCodeId: number,
  args: { name: string; slug: string; content: string }
) => {
  const wp = await WP();
  const { name, slug, content } = args;
  if (await exists(name, customCodeId)) {
    throw new Error("Custom code with the same name already exists");
  }

  const result = await actionsPost.update(customCodeId, {
    post_title: name,
    post_name: slug,
    post_content: content,
  });

  return handleResponse(wp, {
    data: result.data,
    info: undefined,
  });
};

export const del = async (customCodeId: number) => {
  const wp = await WP();

  // Delete custom code from wp_posts
  const result = await actionsPost.del(customCodeId);
  const resultTerms = await delEditorTerms(customCodeId, "custom-code");

  if (!resultTerms.success) {
    return createResponsePayload({
      success: false,
      error: resultTerms.error,
    });
  }

  return handleResponse(wp, result);
};

export const list = async (
  args?: wpTypes.crud.CrudParameters<"post", "list">[0],
  options?: wpTypes.crud.CrudParameters<"post", "list">[1]
) => {
  const wp = await WP();
  options = { ...options, postTypes: ["next-custom-code"] };
  return handleResponse(
    wp,
    actionsPost.list(
      { ...args, per_page: 999, orderby: "menu_order", order: "asc" },
      options
    )
  );
};

export const getBySlugs = async (slugs: string[]) => {
  const wp = await WP();
  const result = await actionsPost.list(
    {
      slug: slugs,
      per_page: 999,
      orderby: "menu_order",
      order: "asc",
    },
    {
      postTypes: ["next-custom-code"],
    }
  );

  // Sort custom codes by the order of slugs
  const sortedCustomCodes = slugs
    .map((slug) =>
      result.data.find((customCode) => customCode.post_name === slug)
    )
    .filter((customCode) => !!customCode);

  return handleResponse(wp, { data: sortedCustomCodes, info: undefined });
};

// ---------------------------------------------------------------------------
// Custom Code Usage Tracking
// ---------------------------------------------------------------------------
// Tracks which custom codes are used by each template. This enables monitoring
// template-to-custom-code relationships and cleaning up unused custom codes.
//
// These functions are called from the editor to manage custom code associations
// with templates. Custom code IDs are stored as taxonomy terms on template posts.
// ---------------------------------------------------------------------------

export const updateTermsByTemplateId = async (templateId: number) => {
  const wp = await WP();
  const template = await actionsPost.get(templateId);

  if (!template.data) {
    return createResponsePayload({
      success: false,
      error: "Template not found",
    });
  }

  const editorStateString = template.data.post_content;

  // Parse the template's editor state to find all referenced custom code nodes.
  // 1. Load the editor state into a headless Lexical editor
  // 2. Walk the node tree to collect custom code slugs
  // 3. Resolve slugs to IDs, then sync them as taxonomy terms on the template post
  auditServerDom();

  // Register node creators BEFORE creating the editor
  registerNodeCreators();

  const editor = createLexicalEditor({
    isHeadless: true,
    editable: true,
  });

  const editorState = editor.parseEditorState(editorStateString);

  editor.update(
    () => {
      editor.setEditorState(editorState);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  // Load editor
  await processAllWidgets(editor);
  let customCodeSlugs: string[] = [];
  editor.read(() => {
    $walkNode($getRoot(), (node) => {
      if ($isCustomCodeNode(node)) {
        const slugs = Array.from([
          ...node.__slugs.header,
          ...node.__slugs.footer,
        ]);
        customCodeSlugs.push(...slugs);
      }
    });
  });

  if (customCodeSlugs.length > 0) {
    const resultCustomCodes = await getBySlugs(customCodeSlugs);

    if (resultCustomCodes.success) {
      const customCodesIds = (resultCustomCodes.data as types.CustomCode[]).map(
        (code) => code.ID
      );

      // Finally call updateTerms
      await updateTerms(templateId, customCodesIds);
    }
  }
};

// Update custom code terms associated with the template
export const updateTerms = async (
  templateId: number,
  customCodeIds: number[]
) => {
  return updateEditorTerms(templateId, customCodeIds, "custom-code");
};

// Append custom code terms to the template
export const appendTerms = async (
  templateId: number,
  customCodeIds: number[]
) => {
  return appendEditorTerms(templateId, customCodeIds, "custom-code");
};

const helperGetByTemplate = async (templateId: number) => {
  // Get custom code terms associated with the template
  const resultTerms = await actionsTerm.list(
    "custom-code",
    {
      post: templateId,
    },
    {
      context: "edit",
    }
  );

  const terms = resultTerms.data;

  if (!terms) {
    return [];
  }

  // term names are custom code IDs
  // See updateTerms for how terms are added to the template
  const customCodeIds = terms
    .map((term) => parseInt(term.name))
    .filter((v) => typeof v === "number" && !isNaN(v));

  // Get custom codes by custom code IDs
  const resultPosts = await actionsPost.list(
    {
      include: customCodeIds,
    },
    {
      postTypes: ["next-custom-code"],
    }
  );

  const posts = resultPosts.data;

  if (!posts) {
    return [];
  }

  // Sort custom codes (posts) by term_order
  const sortedTerms = terms.sort((a, b) => a.term_order - b.term_order);

  const sortedPosts = sortedTerms
    .map((term) => posts.find((post) => post.ID === parseInt(term.name)))
    .filter((post) => !!post);

  return sortedPosts;
};

// export const getByTemplates = async (templateIds: number[]) => {
//   const wp = await WP();
//   const customCodes = await Promise.all(
//     templateIds.map((templateId) => helperGetByTemplate(templateId))
//   );
//   const flatCustomCodes = customCodes.flat();

//   const customCodeIds: number[][] = [];
//   for (let index = 0; index < customCodes.length; index++) {
//     const customCode = customCodes[index];
//     customCodeIds[index] = customCode.map((customCode) => customCode.ID);
//   }

//   // Helper function to merge arrays and sort by priority
//   const mergeArrays = (...arrays: number[][]): number[] => {
//     const mergedMap = new Map<number, number>();

//     // Iterate over each array
//     arrays.forEach((arr) => {
//       arr.forEach((num, index) => {
//         // Add number to map or update its priority (lower index = higher priority)
//         if (!mergedMap.has(num) || mergedMap.get(num)! > index) {
//           mergedMap.set(num, index);
//         }
//       });
//     });

//     // Convert the map into an array and sort by priority (index value)
//     return Array.from(mergedMap.keys()).sort(
//       (a, b) => mergedMap.get(a)! - mergedMap.get(b)!
//     );
//   };

//   const mergedCustomCodeIds = mergeArrays(...customCodeIds);

//   const sortedCustomCodes: types.CustomCode[] = mergedCustomCodeIds.map(
//     (id) => flatCustomCodes.find((customCode) => customCode.ID === id)!
//   );

//   return handleResponse(wp, { data: sortedCustomCodes, info: undefined });
// };

export const getByTemplate = async (templateId: number) => {
  const wp = await WP();
  const customCodes = await helperGetByTemplate(templateId);
  return handleResponse(wp, { data: customCodes, info: undefined });
};

export const changeOrder = async (customCodeId: number, newOrder: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Not permitted to change order",
      data: undefined,
    });
  }

  const result = await wp.utils.trx.post.updateMenuOrder(
    customCodeId,
    newOrder
  );

  return createResponsePayload({
    success: result,
    data: {},
  });
};

export const swapOrder = async (
  customCodeId1: number,
  customCodeId2: number
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Permission Error",
    });
  }

  const result = await wp.utils.trx.post.swapMenuOrder(
    customCodeId1,
    customCodeId2
  );

  return createResponsePayload({
    success: result,
    data: null,
  });
};
