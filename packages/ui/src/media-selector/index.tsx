"use client";
import { useEffect, useState } from "react";

import { Box } from "@mui/material";
import { Modal, ModalContent } from "../Modal";
import { Tabs } from "../Tabs";
import { Typography } from "../Typography";

import { MediaUpload } from "../media/MediaUpload";
import { MediaSelectorList } from "./MediaSelectorList";
import { MediaSelectorPreview } from "./MediaSelectorPreview";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useMediaSelector } from "../hooks/use-media-selector";

export const MediaSelectorModal = () => {
  const { globalState } = useWP();

  const mediaSelector = useMediaSelector();
  const [tabIndex, setTabIndex] = useState<number>(0);

  useEffect(() => {
    return () => {
      handleClose();
    };
  }, []);

  const handleClose = () => {
    globalState.set({
      "media-selector-preview": { open: false },
    });

    mediaSelector.close();
  };

  return (
    <Modal open={mediaSelector.isOpen} onClose={handleClose}>
      <ModalContent
        minWidth="95%"
        sx={{
          minHeight: "90%",
          maxHeight: "90%",
          overflowY: "auto",
        }}
      >
        <Typography size="large" bold>
          Select or Upload Media
        </Typography>
        <Box>
          <MediaSelectorPreview />

          <Tabs
            size="medium"
            tabIndex={tabIndex}
            onChange={(index) => {
              setTabIndex(index);
            }}
            items={[
              {
                label: "Media Library",
                content: <MediaSelectorList />,
              },
              {
                label: "Upload files",
                content: (
                  <MediaUpload
                    style={{
                      minHeight: "50dvh",
                    }}
                    onUploadComplete={() => {
                      // Switch to the first tab after upload
                      setTabIndex(0);
                    }}
                  />
                ),
              },
            ]}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
};
