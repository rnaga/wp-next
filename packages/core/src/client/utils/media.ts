import mime from "mime-types";

import * as actionMeta from "../../server/actions/meta";
import * as wpCoreTypes from "../../types";

const toBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const mediaMetakeys: wpCoreTypes.MediaMetakeys = [
  "_wp_attachment_metadata",
  "_wp_attachment_image_alt",
] as const;

export const getMimeType = (file: string) => {
  return mime.lookup(file) || "application/octet-stream";
};

export async function getMetadaList(post: wpCoreTypes.actions.Posts[number]) {
  if (!post || !post.ID) {
    return [];
  }

  const postId = post.ID;

  const response = await actionMeta.get(
    "post",
    postId,
    mediaMetakeys as string[]
  );

  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Failed to get metadata");
  }

  const metadata = response.data._wp_attachment_metadata;

  const mapping: Record<string, [any, any]> = {
    "Uploaded on": [post.post_date, `${post.post_date}`],
    "Uploaded by": [post.author.display_name, post.author.display_name],
    "File name": [metadata.file, metadata.file],
    "File type": [
      metadata.mime_type ?? getMimeType(metadata.file),
      metadata.mime_type ?? getMimeType(metadata.file),
    ],
    "File size": [metadata?.filesize, toBytes(metadata?.filesize)],
    Length: [metadata.length, metadata.length],
  };

  return Object.entries(mapping)
    .filter(([, value]) => !!value[0])
    .map(([key, value]) => [key, value[1]]) as [
    string,
    string | React.ReactNode
  ][];
}
