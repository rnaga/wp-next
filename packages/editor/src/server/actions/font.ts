"use server";
import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import {
  createErrorResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import { WP } from "@rnaga/wp-next-core/server/wp";
import { formatting } from "@rnaga/wp-node/common/formatting";
import * as wpTypes from "@rnaga/wp-node/types";

import * as types from "../../types";
import { checkPermission } from "./check-permission";

const getFontFaceById = async (
  ID: number
): Promise<types.FontFace | undefined> => {
  const wp = await WP();
  const fontFacePost = await wp.utils.post.get(ID);

  if (!fontFacePost || fontFacePost.props?.post_type !== "next-font-face") {
    return undefined;
  }

  const metas = await fontFacePost.meta.props();
  let url = metas.url;

  // if font file id is provided, get URL via post
  if (parseInt(metas.font_file_id) > 0) {
    const fontFile = await wp.utils.post.get(parseInt(metas.font_file_id));
    url = fontFile?.props?.guid ?? url;
  }

  if (!url) {
    return undefined;
  }

  return {
    ID: fontFacePost.props!.ID,
    name: fontFacePost.props!.post_title,
    fontWeight: parseInt(metas.weight) as types.FontFace["fontWeight"],
    fontStyle: metas.style as types.FontFace["fontStyle"],
    url,
    fontFileId: parseInt(metas.font_file_id),
  };
};

const getFontFaces = async (
  wp: Awaited<ReturnType<typeof WP>>,
  fontFamilyId: number
): Promise<types.FontFace[]> => {
  const fontFamily = await wp.utils.post.get(fontFamilyId);
  const fontFaces: types.FontFace[] = [];

  // Get all font faces associated with the font family
  const fontFacePosts = wp.utils.post.toPosts(
    (await fontFamily.children()).filter(
      (face) => face.post_type === "next-font-face"
    )
  );

  // Get the font face for each post (i.e. WpPost that represents a font face)
  for (const facePost of fontFacePosts) {
    const fontFace = await getFontFaceById(facePost.props!.ID);
    fontFace && fontFaces.push(fontFace);
  }

  return fontFaces;
};

export const list = async (args?: Parameters<typeof actionsPost.list>[0]) => {
  const wp = await WP();
  const { data: fontFamilies } = await actionsPost.list(
    {
      per_page: 100,
      ...args,
    },
    {
      postTypes: ["next-font-family"],
    }
  );

  let fontFaceMap: Record<number, types.FontFace[]> = {};

  // Get the font faces for each font family
  for (const fontFamily of fontFamilies) {
    fontFaceMap[fontFamily.ID] = await getFontFaces(wp, fontFamily.ID);
  }

  return handleResponse(wp, {
    data: fontFamilies,
    info: {
      fontFaceMap,
    },
  });
};

export const get = async (id: number) => {
  const wp = await WP();
  const result = await actionsPost.list(
    {
      include: [id],
      per_page: 1,
    },
    {
      postTypes: ["next-font-family"],
    }
  );

  const customCode = result.data[0];
  return handleResponse(wp, { data: customCode, info: undefined });
};

const exists = async (slug: string, exclude?: number[]) => {
  const { data } = await actionsPost.list(
    {
      slug: [slug],
      ...(exclude ? { exclude } : {}),
    },
    {
      postTypes: ["next-font-family"],
    }
  );
  return data.length > 0;
};

export const create = async (name: string) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const slug = formatting.slug(name);

  if (await exists(slug)) {
    return createErrorResponsePayload("Font family already exists");
  }

  const response = await actionsPost.create({
    post_title: name,
    post_name: slug,
    post_type: "next-font-family",
  });

  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const update = async (ID: number, newName: string) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const slug = formatting.slug(newName);

  if (await exists(slug, [ID])) {
    return createErrorResponsePayload("Font family already exists");
  }

  const response = await actionsPost.update(ID, {
    post_title: newName,
    post_name: slug,
  });

  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const del = async (ID: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  // First delete all font faces associated with the font family
  const fontFamily = await wp.utils.post.get(ID);
  const fontFaces = await fontFamily.children();
  for (const fontFace of fontFaces) {
    await wp.utils.trx.post.remove(fontFace.ID);
  }

  const response = await actionsPost.del(ID);
  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const getFontFace = async (ID: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const fontFace = await getFontFaceById(ID);

  if (!fontFace) {
    return createErrorResponsePayload("Font face not found");
  }

  return handleResponse(wp, {
    data: fontFace,
    info: undefined,
  });
};

export const createFontFace = async (
  fontFamilyId: number,
  args: {
    name: string;
    weight?: types.FontWeight;
    style?: types.FontStyle;
  } & (
    | {
        fontFileId: number;
        url?: never;
      }
    | {
        fontFileId?: never;
        url: string;
      }
  )
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const { name, weight = 0, style = "", fontFileId = 0, url = "" } = args;

  // if fontFileId is provided, verify that it exists
  if (fontFileId) {
    const { data: fontFile } = await actionsPost.get(fontFileId);
    if (!fontFile || fontFile.post_type !== "attachment") {
      return createErrorResponsePayload("Font file not found");
    }
  }

  // Verify if fontFamily exists
  const { data: fontFamily } = await actionsPost.get(fontFamilyId);
  if (!fontFamily || fontFamily.post_type !== "next-font-family") {
    return createErrorResponsePayload("Font family not found");
  }

  // Create the font face
  const response = await actionsPost.create({
    post_title: name,
    post_type: "next-font-face",
    post_parent: fontFamilyId,
    meta_input: {
      style,
      weight,
      font_file_id: fontFileId,
      url: fontFileId > 0 ? "" : url, // if fontFileId is provided, url is not needed
    },
  });

  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const updateFontFace = async (
  ID: number,
  args: Partial<
    {
      name: string;
      weight: types.FontWeight;
      style: types.FontStyle;
    } & (
      | {
          fontFileId: number;
          url?: never;
        }
      | {
          fontFileId?: never;
          url: string;
        }
    )
  >
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const { name, weight = 0, style = "", fontFileId = 0, url = "" } = args;

  // if fontFileId is provided, verify that it exists
  if (fontFileId) {
    const { data: fontFile } = await actionsPost.get(fontFileId);
    if (!fontFile || fontFile.post_type !== "attachment") {
      return createErrorResponsePayload("Font file not found");
    }
  }

  // Verify if fontFace exists
  const fontFace = await wp.utils.post.get(ID);
  if (!fontFace || fontFace.props?.post_type !== "next-font-face") {
    return createErrorResponsePayload("Font face not found");
  }

  // Get the current font face
  const metas = await fontFace.meta.props();

  // Update the font face
  const response = await actionsPost.update(ID, {
    post_title: name,
    meta_input: {
      weight: weight,
      style: style,
      font_file_id: fontFileId,
      url: fontFileId > 0 ? "" : url, // if fontFileId is provided, url is not needed
    },
  });

  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const delFontFace = async (ID: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  // Verify if fontFace exists
  const fontFace = await wp.utils.post.get(ID);
  if (!fontFace || fontFace.props?.post_type !== "next-font-face") {
    return createErrorResponsePayload("Font face not found");
  }

  const response = await actionsPost.del(ID);
  return handleResponse(wp, {
    data: response.data,
    info: undefined,
  });
};

export const getCssFontFaces = async (
  // slug
  fontFamilyNames: string[]
): Promise<string> => {
  const wp = await WP();
  const fontFaces: Record<string, types.FontFace[]> = {};

  const fontFamiliesPosts = await actionsPost.list(
    {
      slug: fontFamilyNames,
    },
    {
      postTypes: ["next-font-family"],
    }
  );

  const fontFamilies = wp.utils.post.toPosts(fontFamiliesPosts.data);

  for (const fontFamily of fontFamilies) {
    // const fontFamily = await wp.utils.post.get(id);
    if (!fontFamily || fontFamily.props?.post_type !== "next-font-family") {
      continue;
    }

    const id = fontFamily.props.ID;

    const faces = await getFontFaces(wp, id);

    fontFaces[fontFamily.props.post_title] = faces;
  }

  let css = "";
  for (const [fontFamily, faces] of Object.entries(fontFaces)) {
    for (const face of faces) {
      css += `@font-face {
      font-family: '${fontFamily}';
            ${
              face.fontStyle && face.fontStyle.length > 0
                ? `font-style: ${face.fontStyle};`
                : ""
            }
      ${
        face.fontWeight && face.fontWeight > 0
          ? `font-weight: ${face.fontWeight};`
          : ""
      }
      src: url('${face.url}');
      }\n`;
    }
  }
  return css;
};

export const listFontFiles = async (
  args?: Parameters<typeof actionsPost.list>[0]
) => {
  const wp = await WP();

  // Check if the user has permission to list font files
  // since it searches with post meta by enabling context: edit
  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const { data: fontFiles } = await actionsPost.list(
    {
      per_page: 99,
      ...args,
      status: ["inherit"],
    },
    { postTypes: ["attachment"], mimeTypes: ["ttf", "woff", "woff2"] }
  );

  const fontFileIds = fontFiles.map((file) => file.ID);
  const fontFaceMap: Record<number, wpTypes.WpPosts[]> = {};

  // Find fontFaces that are associated with the font files
  for (const fontFileId of fontFileIds) {
    const { data: fontFace } = await actionsPost.list(
      {
        meta: {
          key: "font_file_id",
          value: `${fontFileId}`,
        },
      },
      {
        postTypes: ["next-font-face"],
        context: "edit",
      }
    );

    if (fontFace.length > 0) {
      fontFaceMap[fontFileId] = fontFace;
    }
  }

  return handleResponse(wp, {
    data: fontFiles,
    info: {
      fontFaceMap,
    },
  });
};
