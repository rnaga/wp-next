import { Fragment, ReactElement, useEffect, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PreviewIcon from "@mui/icons-material/Preview";
import {
  Box,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { getMetadaList } from "@rnaga/wp-next-core/client/utils/media";
import { MediaGridForm } from "@rnaga/wp-next-ui/media/MediaGridForm";
import { MediaTag } from "@rnaga/wp-next-ui/MediaTag";
import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useAdminServerActions } from "../../../hooks/use-admin-server-actions";
import { useWPAdmin } from "../../../wp-admin";

const ButtonTooltip = (props: {
  title: string;
  children: ReactElement;
  color: "primary" | "inherit" | "success" | "warning" | "default" | "error";
  href?: string;
  onClick?: () => void;
}) => {
  const { title, children, color, href = undefined, onClick } = props;
  return (
    <Tooltip title={title} placement="top">
      <IconButton color={color} component="a" href={href} onClick={onClick}>
        {children}
      </IconButton>
    </Tooltip>
  );
};

export const Edit = () => {
  const {
    overlay,
    wp: { viewport, globalState },
  } = useWPAdmin();
  const { actions, safeParse } = useAdminServerActions();

  const mediaEditModalState = globalState.get("media-edit-modal");
  const mediaTargetItemState = globalState.get("media-target-item");

  const { refresh } = useAdminNavigation();

  const post = mediaTargetItemState?.post;

  const [metadataList, setMedataList] =
    useState<Awaited<ReturnType<typeof getMetadaList>>>();

  useEffect(() => {
    if (!post) return;
    getMetadaList(post).then((medataList) => {
      setMedataList(medataList);
    });
  }, [post?.ID]);

  const handleTrash = () => {
    if (!post) {
      return;
    }

    overlay.confirm.open(
      "This action cannot be undone. This will permanently delete your item.",
      async (confirm) => {
        if (!confirm) {
          return;
        }

        const result = await overlay.circular.promise(
          actions.post.trash(post.ID).then(safeParse)
        );

        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }

        globalState.set({
          "media-edit-modal": { open: false },
          "media-target-item": { post: undefined },
        });
        refresh(["main"]);
      }
    );
  };

  if (!post || !metadataList) {
    return null;
  }

  return (
    <Modal
      open={mediaEditModalState?.open ?? false}
      onClose={() => {
        globalState.set({
          "media-target-item": { post: undefined },
          "media-edit-modal": { open: false },
        });
      }}
      sx={{ zIndex: 2 }}
    >
      <ModalContent
        sx={{
          minWidth: "80%",
        }}
      >
        <DialogTitle>Attachment details</DialogTitle>
        <DialogContent
          sx={{
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <Grid
            container
            spacing={2}
            sx={{
              flexGrow: 1,
            }}
          >
            <Grid size={{ xs: viewport.isMobile ? 12 : 7 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: "700px",
                }}
              >
                <MediaTag
                  post={post}
                  slotSxProps={{ icon: { fontSize: 200 } }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: viewport.isMobile ? 12 : 5 }}>
              <List
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <ListItem
                  sx={{
                    justifyContent: "flex-end",
                  }}
                >
                  <Box>
                    <List>
                      <ListItem>
                        <ButtonTooltip
                          title="Preview"
                          color="inherit"
                          href={post.guid}
                        >
                          <PreviewIcon />
                        </ButtonTooltip>
                        <ButtonTooltip
                          title="Download"
                          color="primary"
                          href={post.guid}
                        >
                          <FileDownloadIcon />
                        </ButtonTooltip>
                        <ButtonTooltip
                          title="Delete permanently"
                          color="error"
                          onClick={handleTrash}
                        >
                          <DeleteIcon />
                        </ButtonTooltip>
                      </ListItem>
                    </List>
                  </Box>
                </ListItem>
                <ListItem>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      flexGrow: 1,
                    }}
                  >
                    {metadataList.map(([key, value]) => (
                      <Fragment key={key}>
                        <Grid size={{ xs: 4 }}>
                          <Typography>{key}:</Typography>
                        </Grid>
                        <Grid size={{ xs: 8 }}>
                          <Typography
                            fontWeight={300}
                            sx={{
                              overflowWrap: "break-word",
                            }}
                          >
                            {value}
                          </Typography>
                        </Grid>
                      </Fragment>
                    ))}
                  </Grid>
                </ListItem>
                <Divider />
                <ListItem>
                  <MediaGridForm />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </DialogContent>
      </ModalContent>
    </Modal>
  );
};
