"use server";
import { handleResponse } from "@rnaga/wp-next-core/server/actions/response";
import { WP } from "@rnaga/wp-next-core/server/wp";

export const counts = async () => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const posts = await wpCrud.post.list(
    { per_page: 1 },
    { postTypes: ["post"] }
  );
  const postCount = posts.info?.pagination.count ?? 0;

  const pages = await wpCrud.post.list(
    { per_page: 1 },
    { postTypes: ["page"] }
  );
  const pageCount = pages.info?.pagination.count ?? 0;

  const comments = await wpCrud.comment.list({
    per_page: 1,
    status: "approve",
    type: "comment",
  });
  const commentCount = comments.info?.pagination.count ?? 0;

  return await handleResponse(wp, {
    data: {
      posts: postCount,
      comments: commentCount,
      pages: pageCount,
    },
    info: undefined,
  });
};

export const activity = async () => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const posts = await wpCrud.post.list(
    { per_page: 5, status: ["publish"] },
    { postTypes: ["post"] }
  );

  const comments = await wpCrud.comment.list({
    per_page: 5,
    status: "approve",
    type: "comment",
  });

  const commentIds: [commentId: number][] = comments.data.map((comment) => [
    comment.comment_ID,
  ]);

  // const commentPermissions = !wp.current.user
  //   ? []
  //   : await wp.current.user.bulkCan("edit_comment", commentIds);

  return await handleResponse(wp, {
    data: {
      posts: posts.data,
      comments: comments.data,
      //comment_permissions: commentPermissions.flatMap((v) => v[1]),
    },
    info: {
      posts: posts.info,
      comments: comments.info,
    },
  });
};
