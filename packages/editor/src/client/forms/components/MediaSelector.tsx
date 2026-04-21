import { useEffect, useMemo, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, Card, CardMedia, IconButton } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useMediaSelector } from "@rnaga/wp-next-ui/hooks/use-media-selector";
import { Input } from "@rnaga/wp-next-ui/Input";
import { MediaSelectorModal } from "@rnaga/wp-next-ui/media-selector";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { DataInput } from "../components/DataInput";
import { FormFlexBox, FormStyleControl } from "./Form";

export const MediaSelector = (props: {
  onChange: (url: string) => void;
  mediaUrl?: string;
  size?: "small" | "medium";
  mediaType?: "img" | "video" | "audio";
}) => {
  const { onChange, size = "medium", mediaType = "img" } = props;

  const mediaSelector = useMediaSelector();
  const [editor] = useLexicalComposerContext();

  const [openModal, setOpenModal] = useState(false);

  const [mediaUrl, setMediaUrl] = useState<string>(props.mediaUrl ?? "");
  const mediaUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setMediaUrl(props.mediaUrl ?? "");
  }, [props.mediaUrl]);

  const handleChangeMediaUrl = (value: string) => {
    mediaUrlRef.current = value;
  };

  const handleChange = (value: string) => {
    setMediaUrl(value);
    onChange(value);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleRefresh = () => {
    if (!mediaUrlRef.current) return;
    setMediaUrl(mediaUrlRef.current);
    onChange(mediaUrlRef.current);
  };

  const handleSubmit = () => {
    onChange(mediaUrlRef.current ?? "");
    setOpenModal(false);
  };

  return (
    <>
      <MediaSelectorModal />

      <Modal open={openModal} onClose={handleCloseModal}>
        <ModalContent
          sx={{
            minHeight: "60%",
            maxHeight: "90vh",
            minWidth: "40vw",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography size="large" bold>
              Set Media
            </Typography>

            <Box
              sx={{
                display: "flex",
              }}
            >
              <DataInput
                size={size}
                onChange={handleChangeMediaUrl}
                name="url"
                value={mediaUrl ?? ""}
                sx={{
                  width: "100%",
                  flexGrow: 1,
                }}
              />
              <IconButton
                onClick={handleRefresh}
                sx={{
                  fontSize: size === "medium" ? 24 : 20,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
            <Box
              component="ul"
              sx={{ display: "flex", gap: 2, flexWrap: "wrap", p: 0, m: 0 }}
            >
              <Card
                component="li"
                sx={{
                  flexGrow: 1,
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {!mediaUrl ? (
                  <Box>
                    <PermMediaIcon
                      sx={{
                        width: 120,
                        height: 300,
                      }}
                    />
                  </Box>
                ) : (
                  <CardMedia
                    component={mediaType}
                    {...(mediaType === "video" ? { controls: true } : {})}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      objectFit: "contain",
                    }}
                    image={mediaUrl}
                    alt="Selected media"
                  />
                )}
              </Card>
            </Box>
            <Button size={size} onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </ModalContent>
      </Modal>
      <FormFlexBox>
        <FormStyleControl title="URL" width="100%">
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: "column",
            }}
          >
            <Input
              size={size}
              value={mediaUrl ?? ""}
              readOnly={true}
              onClick={() => setOpenModal(true)}
            />

            <Button
              size={"small"}
              onClick={() => {
                mediaSelector.open(
                  [mediaType == "img" ? "image" : mediaType],
                  (post) => {
                    handleChange(post.guid);
                  }
                );
              }}
            >
              <Typography size={size}>Open Media Library</Typography>
            </Button>
          </Box>
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
