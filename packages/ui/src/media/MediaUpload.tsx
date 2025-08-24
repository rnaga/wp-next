"use client";
import React, { useState, useTransition } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, LinearProgress } from "@mui/material";
import { Button } from "../Button";
import { useWPTheme } from "../ThemeRegistry";
import { Typography } from "../Typography";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const MediaUpload = (
  props?: Partial<{
    showCloseButton: boolean;
    style: React.CSSProperties | undefined;
    onUploadComplete?: () => void;
  }>
) => {
  const { showCloseButton = false, style = {}, onUploadComplete } = props ?? {};

  const { error, viewport, globalState } = useWP();
  const { actions, safeParse } = useServerActions();

  const { wpTheme } = useWPTheme();
  const [dragBoxColor, setDragBoxColor] = useState(wpTheme.colorScale[100]);

  const [loading, startTransition] = useTransition();

  const handleUpload = (files: FileList | null) => {
    if (!files) {
      return;
    }
    const form = new FormData();
    for (const [k, file] of Object.entries(files)) {
      form.append(`file_${k}`, file);
    }

    startTransition(async () => {
      const response = await actions.media.upload(form).then(safeParse);
      if (response.success) {
        // overlay.snackbar.open(
        //   "success",
        //   "New media has been successfully added"
        // );
        // refresh(["main"]);
        onUploadComplete?.();
      } else {
        error.throw(response.error ?? "Failed to upload media");
      }
    });
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        border: "1px solid",
        backgroundColor: dragBoxColor,
        borderColor: (theme) => theme.palette.divider,
        minHeight: 150,
        maxHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginBottom: 20,
        ...style,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        dragBoxColor === wpTheme.colorScale[100] &&
          setDragBoxColor(wpTheme.colorScale[300]);
      }}
      onDragLeave={(e) => {
        dragBoxColor === wpTheme.colorScale[300] &&
          setDragBoxColor(wpTheme.colorScale[100]);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();

        dragBoxColor === wpTheme.colorScale[300] &&
          setDragBoxColor(wpTheme.colorScale[100]);

        handleUpload(e.dataTransfer.files);
      }}
    >
      {showCloseButton && (
        <Box sx={{ position: "absolute", right: 0, top: 0 }}>
          <IconButton>
            <CloseIcon
              onClick={() => {
                globalState.set("media-upload", { open: false });
              }}
            />
          </IconButton>
        </Box>
      )}
      <Box textAlign="center" sx={{ display: "grid", rowGap: 1 }}>
        {loading ? (
          <>
            <Typography>Uploading...</Typography>
            <LinearProgress />
          </>
        ) : (
          <>
            <Typography fontWeight={500}>Drop files to upload</Typography>
            <Typography>or</Typography>
            <Button component="label" role={undefined}>
              Browse files
              <input
                style={{
                  width: "1px",
                }}
                onChange={(e) => {
                  console.log(e.target.files);
                  handleUpload(e.target.files);
                }}
                type="file"
              />
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};
