import type * as types from "../../types";

export interface MapMetaCapArgs {
  edit_comment: [types.actions.Comments[number]];
  edit_post: [types.actions.Posts[number] | types.actions.Comments[number]];
  edit_page: [types.actions.Posts[number] | types.actions.Comments[number]];
  edit_user: [types.actions.User];
  edit_posts: [];
  edit_pages: [];
  moderate_comments: [];
  manage_categories: [];
}

export const capabilities = <T extends keyof MapMetaCapArgs>(
  action: T,
  user: types.User | undefined,
  ...args: MapMetaCapArgs[T]
): boolean => {
  let comment: types.actions.Comments[number];
  let post: types.actions.Posts[number] | types.actions.Comments[number];

  if (!user) {
    return false;
  }

  switch (action) {
    case "edit_comment":
      [comment] = args as MapMetaCapArgs["edit_comment"];

      return comment.comment_post_ID
        ? capabilities("edit_post", user, comment)
        : user.role.capabilities.has("edit_posts");

    case "moderate_comments":
      return user.role.capabilities.has("moderate_comments");

    case "edit_post":
    case "edit_page":
      [post] = args as MapMetaCapArgs["edit_post"];

      if (post.post_type === "revision") {
        return false;
      }

      if (!["post", "page", "attachment"].includes(post.post_type)) {
        return user.role.capabilities.has("edit_others_posts");
      }

      if (user.ID == post.post_author) {
        if (["publish", "future"].includes(post.post_status)) {
          return user.role.capabilities.has("edit_published_posts");
        }
        return user.role.capabilities.has("edit_posts");
      }

      return user.role.capabilities.has("edit_others_posts");

    case "edit_posts":
    case "edit_pages":
      return user.role.capabilities.has("edit_posts");
    case "manage_categories":
      return user.role.capabilities.has("manage_categories");
  }

  return false;
};
