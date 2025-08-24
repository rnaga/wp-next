"use server";
import { createResponsePayload } from "./response";
import { WP } from "../wp";
import * as wpTypes from "@rnaga/wp-node/types";
import { update as postUpdate } from "./post";
import { update as metaUpdate } from "./meta";

export const update = async (
  postId: number,
  data: Partial<
    Pick<wpTypes.trx.PostUpsert, "post_title" | "post_content" | "post_excerpt">
  >
) => {
  return await postUpdate(postId, { ...data, ID: postId });
};

export const updateAlt = async (postId: number, value: string) => {
  return await metaUpdate("post", postId, {
    _wp_attachment_image_alt: value,
  });
};

export const upload = async (formData: FormData) => {
  const wp = await WP();

  const user = wp.current.user;
  if (!user?.props || !(await user.can("upload_files"))) {
    return createResponsePayload({
      success: true,
      error: "Permission Error",
      data: undefined,
    });
  }

  const userId = user.props.ID;
  const data = [];

  try {
    for (let i = 0; ; i++) {
      const file = formData.get(`file_${i}`) as File | undefined;
      if (!file) {
        break;
      }
      // console.log(`file_${i}`, file);

      const result = await wp.hooks.filter.asyncApply(
        "next_core_media_uploaded",
        wp,
        file
      );

      if (result) {
        const crudResult = await wp.utils.crud.post.create({
          post_author: userId,
          post_title: file.name,
          post_mime_type: file.type,
          post_type: "attachment",
          guid: result.url,
          //file: result.filePath,
        });

        const postId = crudResult.data;

        if (result.metadata) {
          await wp.utils.trx.post.syncAttachmentMetadata(postId, {
            data: result.metadata,
          });
        }

        await wp.utils.trx.meta.upsert(
          "post",
          postId,
          "_wp_next_attached_file",
          result.filePath
        );

        data.push(crudResult.data);
      }
    }

    return createResponsePayload({
      success: true,
      error: undefined,
      data,
    });
  } catch (e) {
    console.log(e);
    return createResponsePayload({
      success: false,
      error: `${e}`,
      data: undefined,
    });
  }
};
