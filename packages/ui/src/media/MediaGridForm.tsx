import { useEffect, useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Input } from "../Input";
import { Typography } from "../Typography";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { mediaMetakeys } from "@rnaga/wp-next-core/client/utils/media";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const MediaGridForm = (
  props?: Partial<{
    onChange: (post: Partial<wpCoreTypes.actions.Post>) => void;
  }>
) => {
  const { onChange } = props ?? {};
  const { error, globalState } = useWP();
  const { actions, safeParse, parse } = useServerActions();

  //const { setFormData } = useFormData<wpTypes.trx.PostUpsert>("post");

  const mediaTargetItemState = globalState.get("media-target-item");

  const post = mediaTargetItemState?.post;

  const [metas, setMetas] = useState<wpCoreTypes.MediaMetas>();
  const [canEdit, setCanEdit] = useState(false);
  const [actionStateText, setActionStateText] = useState<
    "Saving..." | "Saved" | undefined
  >();

  const [guidCopied, setGuidCopied] = useState(false);

  const setActionState = (text: typeof actionStateText) => {
    if (text == "Saved") {
      setActionStateText("Saved");
      setTimeout(() => {
        setActionStateText(undefined);
      }, 2000);
      return;
    }
    setActionStateText(text);
  };

  useEffect(() => {
    if (!post?.ID) return;
    const postId = post.ID;

    actions.meta
      .get("post", postId, mediaMetakeys as string[])
      .then((response) => {
        const [metas] = parse(response);
        setMetas(metas as wpCoreTypes.MediaMetas);
      });

    Promise.all([
      actions.user.can("edit_posts"),
      actions.user.can("edit_post", postId),
    ]).then((responses) => {
      if (
        responses.filter((response) => true === safeParse(response).data)
          .length > 0
      ) {
        setCanEdit(true);

        actions.post.get(postId).then((response) => {
          const result = safeParse(response);
          if (!result.success || result.data.post_status !== "inherit") {
            error.throw(
              "You cannot edit this item because it is not a valid item."
            );
            return;
          }
          //setFormData(response.data);
          onChange?.(response.data);
        });
      }
    });
  }, [post?.ID]);

  const handleUpdate = (...args: Parameters<typeof actions.media.update>) => {
    const [postId, data] = args;

    setActionState("Saving...");
    actions.media
      .update(postId, data)
      .then((response) => {
        const result = safeParse(response);
        if (result.success && post) {
          globalState.set("media-target-item", {
            post: { ...post, ...data },
          });
        }
      })
      .finally(() => {
        setActionState("Saved");
      });
  };

  const handleAltUpdate = (value: string) => {
    if (!post?.ID) return;
    const postId = post.ID;

    setActionState("Saving...");
    actions.media
      .updateAlt(postId, value)
      .then((response) => {
        const result = safeParse(response);
        if (result.success && metas) {
          setMetas({
            ...metas,
            _wp_attachment_image_alt: value,
          });
        }
      })
      .finally(() => {
        setActionState("Saved");
      });
  };

  if (!post) {
    return null;
  }

  return (
    <Grid
      container
      spacing={2}
      sx={{
        flexGrow: 1,
      }}
    >
      <Grid size={{ xs: 12 }} sx={{ position: "absolute" }}>
        <Box
          sx={{
            position: "relative",
            top: -30,
            display: "flex",
            justifyContent: "flex-end",
            mx: 2,
          }}
        >
          <Typography>{actionStateText}</Typography>
        </Box>
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography>Alternative Text</Typography>
      </Grid>
      <Grid size={{ xs: 8 }}>
        <Input
          size="medium"
          multiline
          key="alt-text"
          minRows={3}
          maxRows={3}
          value={metas?._wp_attachment_image_alt}
          onBlur={(value) => canEdit && handleAltUpdate(value)}
          disabled={!canEdit}
          sx={{
            width: "100%",
          }}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography>Title</Typography>
      </Grid>
      <Grid size={{ xs: 8 }}>
        <Input
          size="medium"
          key="title"
          value={post?.post_title}
          onBlur={(value) =>
            canEdit && handleUpdate(post.ID, { post_title: value })
          }
          disabled={!canEdit}
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography>Caption</Typography>
      </Grid>
      <Grid size={{ xs: 8 }}>
        <Input
          size="medium"
          multiline
          key="excerpt"
          minRows={2}
          maxRows={2}
          value={post?.post_excerpt}
          disabled={!canEdit}
          onBlur={(value) =>
            canEdit &&
            handleUpdate(post.ID, {
              post_excerpt: value,
            })
          }
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography>Description</Typography>
      </Grid>
      <Grid size={{ xs: 8 }}>
        <Input
          size="medium"
          multiline
          key="description"
          minRows={2}
          maxRows={2}
          value={post?.post_content}
          disabled={!canEdit}
          onBlur={(value) =>
            canEdit &&
            handleUpdate(post.ID, {
              post_content: value,
            })
          }
          sx={{ width: "100%" }}
        />
      </Grid>
      <Grid
        size={{ xs: 4 }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography>File URL</Typography>
        {guidCopied ? (
          <CheckIcon />
        ) : (
          <Tooltip title="Copy to clipboard" placement="top">
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(post.guid);
                setGuidCopied(true);
                setTimeout(() => {
                  setGuidCopied(false);
                }, 1000);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        )}
      </Grid>

      <Grid size={{ xs: 8 }}>
        <Input
          disabled
          size="medium"
          key="title"
          value={post?.guid}
          sx={{ width: "100%" }}
        />
      </Grid>
    </Grid>
  );
};
