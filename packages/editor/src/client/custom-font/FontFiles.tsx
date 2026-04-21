import { useEffect, useRef, useState, useTransition } from "react";
import { logger } from "../../lexical/logger";

import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";

import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useCustomFont } from "./CustomFontModal";

export const FontFiles = () => {
  const { actions, safeParse, parse } = useEditorServerActions();
  const [loading, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>();
  const { fontFiles, setFontFiles } = useCustomFont();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deletingID, setDeletingID] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const handleUpload = (files: FileList | null) => {
    logger.log("handleUpload", files);
    if (!files) {
      return;
    }

    // Check file extension
    const validExtensions = [".ttf", ".otf", ".woff", ".woff2"];
    const invalidFiles = Array.from(files).filter((file) => {
      const fileExtension = file.name.split(".").pop();
      return !validExtensions.includes(`.${fileExtension}`);
    });

    if (invalidFiles.length > 0) {
      setErrorMessage(
        `Invalid file type. \n Only ${validExtensions.join(
          ", "
        )} files are allowed.`
      );
      return;
    }

    setErrorMessage(undefined);

    const form = new FormData();
    for (const [k, file] of Object.entries(files)) {
      form.append(`file_${k}`, file);
    }

    startTransition(async () => {
      const response = await actions.media.upload(form).then(safeParse);

      if (response.success) {
        logger.log("success");
        //const fonts = await getFontFiles();
        const [fontFiles, info] = await actions.font
          .listFontFiles()
          .then(parse);

        setFontFiles({
          files: fontFiles,
          map: info?.fontFaceMap,
        });
      } else {
        logger.log("failed");
      }
    });
  };

  const handleDelete = async (ID: number) => {
    setErrorMessage(undefined);

    startTransition(async () => {
      const result = await actions.post.del(ID).then(safeParse);
      if (result.success) {
        const [fontFiles, info] = await actions.font
          .listFontFiles()
          .then(parse);

        setFontFiles({
          files: fontFiles,
          map: info?.fontFaceMap,
        });
      }

      setDeletingID(undefined);
    });
  };

  const handleDeleteWithConfirm = (confirm: boolean) => {
    if (!confirm || !deletingID) {
      setOpenConfirm(false);
      return;
    }

    setOpenConfirm(false);
    handleDelete(deletingID);
  };

  useEffect(() => {
    if (fontFiles?.files?.length && fontFiles.files.length > 0) {
      return;
    }
    startTransition(async () => {
      const [fontFiles, info] = await actions.font.listFontFiles().then(parse);

      setFontFiles({
        files: fontFiles,
        map: info?.fontFaceMap,
      });
    });
  }, []);

  return (
    <>
      <ModalConfirm
        title="Confirm Delete"
        message="Are you sure you want to proceed with this action? This font file is used by a font face."
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        callback={handleDeleteWithConfirm}
      />

      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {loading ? (
          <div>Loading...</div>
        ) : fontFiles?.files?.length ? (
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              mb: 2,
              maxHeight: 300,
            }}
          >
            {fontFiles.files.map((font) => (
              <Box
                key={font.ID}
                sx={{
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  display: "flex",
                  gap: 1,
                  justifyContent: "start",
                  justifyItems: "center",
                  mb: 1,
                  p: 1,
                  with: "100%",
                }}
              >
                <Typography
                  size="medium"
                  key={font.ID}
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <span>{font.post_title}</span>
                </Typography>
                <Tooltip title="Download" placement="top">
                  <IconButton
                    href={font.guid}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "#007bff" }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete" placement="top">
                  <IconButton
                    loading={loading && deletingID === font.ID}
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeletingID(font.ID);
                      // open confirm modal before deleting if font is used in font face
                      if (fontFiles.map && fontFiles.map[font.ID]) {
                        setOpenConfirm(true);
                        return;
                      }

                      // delete font file without confirmation
                      handleDelete(font.ID);
                    }}
                    sx={{
                      mb: 0.4,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ flex: 1, textAlign: "center", mb: 2, py: 4 }}>
            <Typography size="medium" sx={{ color: "text.secondary", mb: 1 }}>
              No font files uploaded yet.
            </Typography>
            <Typography size="small" sx={{ color: "text.secondary" }}>
              Upload .ttf, .otf, .woff, or .woff2 files to use as font sources
              in font faces.
            </Typography>
          </Box>
        )}
        <Box>
          {errorMessage && (
            <Typography
              size="medium"
              sx={{
                color: "#d32f2f",
                mb: 2,
              }}
            >
              {errorMessage}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: "center", mt: "auto" }}>
          <Button size="medium" onClick={() => fileInputRef.current?.click()}>
            Upload Fonts
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              handleUpload(e.target.files);
            }}
            multiple
            accept=".ttf,.otf,.woff,.woff2"
            style={{ display: "none" }}
          />
        </Box>
      </Box>
    </>
  );
};
