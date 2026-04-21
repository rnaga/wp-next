import Application from "@rnaga/wp-node/application";
import { readJsonFile } from "@rnaga/wp-node/common/files";
import {
  TEMPLATE_POST_TYPE,
  TEMPLATE_COLLECTION_POST_TYPE,
  TEMPLATE_META_CONFIG_KEY,
  TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY,
  TEMPLATE_META_PAGE_META_KEY,
} from "@rnaga/wp-next-editor/lexical/constants";

import type * as types from "../types";

export const getCollectionPresets = () => {
  return {
    samples: {
      title: "Sample Pages",
      slug: "sample-pages",
      menuOrder: 0,
    },
    errorPages: {
      title: "Error Pages",
      slug: "error-pages",
      menuOrder: 1,
    },
  };
};

export const getEditorPresetTemplates = (templateBaseDir: string) => {
  const jsonFilePath = `${templateBaseDir}/preset-templates`;

  return {
    errorPages: [
      {
        title: "Error Not Found",
        slug: "error-not-found",
        content: readJsonFile(`${jsonFilePath}/error-not-found.json`),
        menuOrder: 0,
      },
      {
        title: "Error Template",
        slug: "error-template",
        content: readJsonFile(`${jsonFilePath}/error-template.json`),
        menuOrder: 1,
      },
      {
        title: "Error Unknown",
        slug: "error-unknown",
        content: readJsonFile(`${jsonFilePath}/error-unknown.json`),
        menuOrder: 2,
      },
    ],
    samples: [
      // - First create Collection (folder) with "Sample Pages" title
      // - Create Widget Template - "header" and "footer"
      // - Create Sample Pages - "About", "Posts", and "Post"
      {
        title: "Header",
        slug: "header",
        content: readJsonFile(`${jsonFilePath}/header.json`),
        [TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY]: true,
        [TEMPLATE_META_CONFIG_KEY]: {
          pathMapping: [],
          queryMapping: {},
          widgetVariants: {
            title: ["string", null],
            "hide-title": ["boolean", null],
          },
        },
        menuOrder: 3,
      },
      {
        title: "Footer",
        slug: "footer",
        content: readJsonFile(`${jsonFilePath}/footer.json`),
        [TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY]: true,
        menuOrder: 4,
      },
      {
        title: "About",
        slug: "about",
        content: readJsonFile(`${jsonFilePath}/about.json`),
        [TEMPLATE_META_PAGE_META_KEY]: { title: "About", description: "" },
        menuOrder: 0,
      },
      {
        title: "Post",
        slug: "post",
        content: readJsonFile(`${jsonFilePath}/post.json`),
        [TEMPLATE_META_CONFIG_KEY]: {
          pathMapping: [
            [
              {
                nodeType: "post-data",
                name: "post",
                queryKey: "slug",
                required: true,
              },
            ],
          ],
          queryMapping: {},
          widgetVariants: {},
        },
        [TEMPLATE_META_PAGE_META_KEY]: {
          title: "${post.post_title}",
          description: "${post.post_excerpt}",
        },
        menuOrder: 1,
      },
      {
        title: "Posts",
        slug: "posts",
        content: readJsonFile(`${jsonFilePath}/posts.json`),
        [TEMPLATE_META_CONFIG_KEY]: {
          pathMapping: [],
          queryMapping: {
            page: [{ nodeType: "posts-data", name: "posts", queryKey: "page" }],
            search: [
              { nodeType: "posts-data", name: "posts", queryKey: "search" },
            ],
          },
          widgetVariants: {},
        },
        [TEMPLATE_META_PAGE_META_KEY]: {
          title: "Latest Posts",
          description: "",
        },
        menuOrder: 2,
      },
    ],
    home: {
      title: "Home",
      slug: "home",
      content: readJsonFile(`${jsonFilePath}/home.json`),
    },
  };
};

const META_KEYS = [
  TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY,
  TEMPLATE_META_CONFIG_KEY,
  TEMPLATE_META_PAGE_META_KEY,
] as const;

const serializeMetaValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
};

export const seedEditorPresetTemplates = async (
  wp: Awaited<ReturnType<typeof Application.getContext>>,
  templateBaseDir: string,
  options?: { verbose?: boolean }
): Promise<types.SeedEditorPresetTemplatesResult> => {
  const templates = getEditorPresetTemplates(templateBaseDir);
  const collectionPresets = getCollectionPresets();

  const result: types.SeedEditorPresetTemplatesResult = {
    collections: [],
    templates: [],
  };

  const upsertTemplate = async (
    item: Record<string, any>,
    parentId: number
  ) => {
    const existingTemplates = await wp.utils.query.posts((query) => {
      query.where("post_name", item.slug);
      query.where("post_type", TEMPLATE_POST_TYPE);
      query.select(["ID"]);
    });

    if (existingTemplates && existingTemplates.length > 0) {
      if (options?.verbose) {
        console.log(
          `Template ${item.title} already exists. Skipping creation.`
        );
      }
      result.templates.push({
        title: item.title,
        slug: item.slug,
        status: "skipped",
      });
      return;
    }

    const templateId = await wp.utils.trx.post.upsert(
      {
        post_title: item.title,
        post_name: item.slug,
        post_type: TEMPLATE_POST_TYPE,
        post_author: 1,
        post_status: "publish",
        post_content: JSON.stringify(item.content),
        post_parent: parentId,
        ...(item.menuOrder !== undefined ? { menu_order: item.menuOrder } : {}),
      },
      // post_content stores Lexical JSON — backslashes in string values (e.g. escaped
      // quotes in fontFamily) are meaningful and must not be stripped by unslash().
      { skipUnslashFields: ["post_content"] }
    );

    if (!templateId) {
      throw new Error(`Failed to create template ${item.title}`);
    }

    for (const metaKey of META_KEYS) {
      if (item[metaKey] !== undefined) {
        await wp.utils.trx.meta.upsert(
          "post",
          templateId,
          metaKey,
          serializeMetaValue(item[metaKey]),
          // Object meta values are JSON-serialized — backslashes are meaningful
          // and must not be stripped by unslash().
          { skipUnslash: true }
        );
      }
    }

    result.templates.push({
      title: item.title,
      slug: item.slug,
      status: "created",
    });
  };

  for (const [key, value] of Object.entries(templates)) {
    if (Array.isArray(value)) {
      const collectionPreset =
        collectionPresets[key as keyof ReturnType<typeof getCollectionPresets>];

      if (!collectionPreset) {
        throw new Error(`No collection preset found for key: ${key}`);
      }

      const existingCollections = await wp.utils.query.posts((query) => {
        query.where("post_name", collectionPreset.slug);
        query.where("post_type", TEMPLATE_COLLECTION_POST_TYPE);
        query.select(["ID"]);
      });

      let collectionId: number;

      if (existingCollections && existingCollections.length > 0) {
        collectionId = existingCollections[0].ID;
        result.collections.push({ ...collectionPreset, status: "skipped" });
      } else {
        collectionId = await wp.utils.trx.post.upsert({
          post_title: collectionPreset.title,
          post_name: collectionPreset.slug,
          post_type: TEMPLATE_COLLECTION_POST_TYPE,
          post_author: 1,
          post_status: "publish",
          post_content: "",
          post_parent: 0,
          menu_order: collectionPreset.menuOrder || 0,
        });

        if (!collectionId) {
          throw new Error(
            `Failed to create template collection: ${collectionPreset.title}`
          );
        }

        result.collections.push({ ...collectionPreset, status: "created" });
      }

      for (const item of value) {
        await upsertTemplate(item, collectionId);
      }
    } else {
      await upsertTemplate(value, 0);
    }
  }

  return result;
};
