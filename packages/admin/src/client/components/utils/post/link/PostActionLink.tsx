import { useState } from "react";

import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { AdminLink } from "../../link";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

type ActionType =
  | "restore"
  | "delete"
  | "edit"
  | "trash"
  | "view"
  | "copy"
  | "download";

export const PostActionLink = (props: {
  post: wpCoreTypes.actions.Posts[number];

  actionLinks: ActionType[];
  onClickEdit?: (post: wpCoreTypes.actions.Posts[number]) => void;
}) => {
  const { post, actionLinks, onClickEdit } = props;
  const { overlay } = useWPAdmin();
  const { actions, safeParse } = useServerActions();
  const { refresh } = useAdminNavigation();

  const [guidCopied, setGuidCopied] = useState(false);

  const elements = [];

  const handleUntrash =
    (post: wpCoreTypes.actions.Posts[number]) => async () => {
      const result = await overlay.circular
        .promise(actions.post.untrash(post.ID))
        .then(safeParse);

      if (!result.success) {
        overlay.snackbar.open("error", result.error);
        return;
      }

      overlay.snackbar.open("success", "Item has been restored");
      refresh(["content"]);
    };

  const handleTrash = (post: wpCoreTypes.actions.Posts[number]) => async () => {
    const result = await overlay.circular
      .promise(actions.post.trash(post.ID))
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    overlay.snackbar.open("warning", "Item has been trashed");
    refresh(["content"]);
  };

  const handleDelete = (post: wpCoreTypes.actions.Posts[number]) => () => {
    const message =
      "This action cannot be undone. This will permanently delete your item.";
    const title = "Are you absolutely sure?";
    overlay.confirm.open(
      message,
      async (confirm) => {
        if (!confirm) {
          return;
        }
        const result = await overlay.circular
          .promise(actions.post.del(post.ID))
          .then(safeParse);

        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }

        overlay.snackbar.open("success", "Item has been deleted Permanently");
        refresh(["content"]);
      },
      title
    );
  };

  const handleCopy = (post: wpCoreTypes.actions.Posts[number]) => () => {
    navigator.clipboard.writeText(post.guid);
    setGuidCopied(true);
    setTimeout(() => {
      setGuidCopied(false);
    }, 1000);
  };

  for (const actionLink of actionLinks) {
    switch (actionLink) {
      case "restore":
        elements.push(
          <AdminLink key={`restore-${post.ID}`} onClick={handleUntrash(post)}>
            Restore
          </AdminLink>
        );
        break;

      case "delete":
        elements.push(
          <AdminLink
            key={`delete-${post.ID}`}
            color="error"
            onClick={handleDelete(post)}
          >
            Delete
          </AdminLink>
        );
        break;

      case "edit":
        onClickEdit
          ? elements.push(
              <AdminLink key={`edit-${post.ID}`} onClick={onClickEdit}>
                Edit
              </AdminLink>
            )
          : elements.push(
              <AdminLink
                key={`edit-${post.ID}`}
                subPage="edit"
                queryParams={{ id: post.ID }}
              >
                Edit
              </AdminLink>
            );
        break;

      case "view":
        elements.push(
          <AdminLink key={`view-${post.ID}`} href={post.guid}>
            View
          </AdminLink>
        );
        break;

      case "copy":
        !guidCopied
          ? elements.push(
              <AdminLink key={`copy-${post.ID}`} onClick={handleCopy(post)}>
                Copy URL
              </AdminLink>
            )
          : elements.push(
              <Typography key={`copied-${post.ID}`} bold>
                Copied
              </Typography>
            );

        break;

      case "trash":
        elements.push(
          <AdminLink
            key={`trash-${post.ID}`}
            color="error"
            onClick={handleTrash(post)}
            size="small"
          >
            Trash
          </AdminLink>
        );
        break;
    }
  }

  return (
    <Box
      sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}
    >
      {elements.map((element) => element)}
    </Box>
  );
};
