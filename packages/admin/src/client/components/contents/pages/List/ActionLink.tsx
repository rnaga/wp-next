import { PostActionLink } from "../../../../components/utils/post/link";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const ActionLink = (props: {
  post: wpCoreTypes.actions.Posts[number];
}) => {
  const { post } = props;
  const { userCan } = useUser();

  // Check if user has permission to edit other posts
  if (!userCan("edit_page", post)) {
    return null;
  }

  return (
    <PostActionLink
      actionLinks={
        post.post_status === "trash" ? ["restore", "delete"] : ["edit", "trash"]
      }
      post={post}
    />
  );
};
