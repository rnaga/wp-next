"use client";

import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";

import { PostActionLink } from "../../../../components/utils/post";
import { useWPAdmin } from "../../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const ActionLink = (props: {
  post: wpCoreTypes.actions.Posts[number];
}) => {
  const { post } = props;
  const {
    wp: { globalState },
  } = useWPAdmin();
  const { userCan } = useUser();

  // Check if user has permission to edit other posts
  if (!userCan("edit_post", post)) {
    return null;
  }

  return (
    <PostActionLink
      actionLinks={["edit", "delete", "view", "copy"]}
      post={post}
      onClickEdit={() => {
        globalState.set({
          "media-edit-modal": {
            open: true,
          },
          "media-target-item": {
            post,
          },
        });
      }}
    />
  );
};
