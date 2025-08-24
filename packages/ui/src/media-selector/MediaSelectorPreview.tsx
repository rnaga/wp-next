import { Fragment, useEffect, useMemo, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, ClickAwayListener, Grid, IconButton } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Button } from "../Button";
import { CardImage } from "../CardImage";
import { useWPTheme } from "../ThemeRegistry";
import { Typography } from "../Typography";

import { getMetadaList } from "@rnaga/wp-next-core/client/utils/media";
import { MediaGridForm } from "../media/MediaGridForm";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useMediaSelector } from "../hooks/use-media-selector";

export const MediaSelectorPreview = () => {
  const { globalState, viewport } = useWP();
  const mediaSelector = useMediaSelector();
  const { user } = useUser();
  const { wpTheme } = useWPTheme();

  const mediaTargetItemState = globalState.get("media-target-item");
  const previewState = globalState.get("media-selector-preview");

  const open = previewState?.open;
  const post = mediaTargetItemState?.post;

  const [metadataList, setMedataList] =
    useState<Awaited<ReturnType<typeof getMetadaList>>>();

  const canEdit = useMemo(
    () => user?.role.capabilities.has("edit_others_posts"),
    [post?.ID]
  );

  useEffect(() => {
    if (!post) return;
    getMetadaList(post).then((medataList) => {
      setMedataList(medataList);
    });

    //return () => globalState.set("media-selector-preview", { open: false });
  }, [post?.ID]);

  if (!open || !post) {
    return null;
  }

  return (
    <ClickAwayListener
      onClickAway={() => {
        globalState.set("media-selector-preview", { open: false });
      }}
    >
      <Box
        sx={{
          borderLeft: 1,
          borderColor: (theme) => theme.palette.divider,
          display: open ? "block" : "none",
          position: "absolute",
          zIndex: 1000,
          width: viewport.isMobile ? "100%" : "40vw",
          minHeight: "100%",
          maxHeight: "calc(100% - 2 * var(--Card-padding))",
          overflowY: "auto",
          top: 0,
          right: 0,
          borderRadius: "var(--Card-childRadius)",
          backgroundColor: wpTheme.colorScale[100],
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 2,
          }}
        >
          <Button
            size="medium"
            onClick={() => {
              mediaSelector.select(post);
              globalState.set("media-selector-preview", { open: false });
              mediaSelector.close();
            }}
          >
            Select{" "}
          </Button>
          <IconButton
            onClick={() => {
              globalState.set("media-selector-preview", { open: false });
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            gap: 2,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: 2,
            alignItems: "top",
            justifyContent: "center",
            //overflow: "auto",
          }}
        >
          <CardImage src={post.guid} alt={post.post_title} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "0.4fr 1fr",
              gap: 0,
            }}
          >
            {metadataList &&
              metadataList
                .filter(
                  ([key]) => !["Uploaded on", "Uploaded by"].includes(key)
                )
                .map(([key, value]) => (
                  <Fragment key={key}>
                    <Typography>{key}:</Typography>
                    <Typography
                      fontWeight={300}
                      sx={{
                        overflowWrap: "break-word",
                      }}
                    >
                      {value}
                    </Typography>
                  </Fragment>
                ))}
          </Box>
        </Box>
        {canEdit && (
          <Grid sx={{ mx: 2 }}>
            <MediaGridForm />
          </Grid>
        )}
      </Box>
    </ClickAwayListener>
  );
};
