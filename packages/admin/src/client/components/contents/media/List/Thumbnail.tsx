"use client";

import { Grid } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { CardImage } from "@rnaga/wp-next-ui/CardImage";

import { useWPAdmin } from "../../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Thumbnail = (props: {
  posts: wpCoreTypes.actions.Posts | undefined;
}) => {
  const { posts } = props;

  const {
    wp: { globalState },
  } = useWPAdmin();
  const { user } = useUser();

  const handleClick = (post: wpCoreTypes.actions.Posts[number]) => () => {
    globalState.set({
      "media-edit-modal": {
        open: true,
      },
      "media-target-item": {
        post,
      },
    });
  };

  const canEdit = (post: wpCoreTypes.actions.Posts[number]) =>
    user?.ID == post.author.ID ||
    user?.role.capabilities.has("edit_others_posts");

  return (
    <Grid container spacing={1} columns={{ xs: 2, sm: 12, md: 12, xl: 12 }}>
      {posts?.map((post) => (
        <Grid key={post.ID} gap={0} size={{ xs: 1, sm: 4, md: 3, xl: 2 }}>
          <CardImage
            src={post.guid}
            alt={post.post_title}
            sx={{
              width: "100%",
              maxHeight: 150,
              cursor: canEdit(post) ? "pointer" : "inherit",
            }}
            onClick={canEdit(post) ? handleClick(post) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
};
