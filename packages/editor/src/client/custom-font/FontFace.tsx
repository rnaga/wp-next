import { useEffect, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { logger } from "../../lexical/logger";

import { Box, FormControl, FormLabel } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectWPPost } from "@rnaga/wp-next-ui/SelectWPPost";

import * as types from "../../types";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";

type FontFaceFormData = Partial<
  Pick<
    types.FontFace,
    "name" | "fontWeight" | "fontStyle" | "url" | "fontFileId"
  >
>;

export const FontFace = (props: {
  open: boolean;
  fontFamilyId: number;
  fontFace?: types.FontFace;
  onClose: () => void;
  onChange: (fontFace: types.FontFace) => void;
}) => {
  const { fontFamilyId, fontFace, onClose, open, onChange } = props;

  const [loading, startTransition] = useTransition();
  const { actions, safeParse } = useEditorServerActions();

  const [formData, setFormData] = useState<FontFaceFormData>({
    name: fontFace?.name ?? undefined,
    fontWeight: fontFace?.fontWeight ?? undefined,
    fontStyle: fontFace?.fontStyle ?? undefined,
    fontFileId: fontFace?.fontFileId ?? undefined,
    url: fontFace?.fontFileId ? "" : fontFace?.url,
  });

  // const formRef = useRef<FontFaceFormData>({
  //   name: fontFace?.name ?? undefined,
  //   fontWeight: fontFace?.fontWeight ?? undefined,
  //   fontStyle: fontFace?.fontStyle ?? undefined,
  //   url: fontFace?.url,
  // });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fontFaceId = fontFace?.ID;

    if (!formData.name || (!formData.fontFileId && !formData.url)) {
      logger.error("Invalid input", formData);
      return;
    }

    const fontFileId = formData.fontFileId ?? 0;
    const url = formData.url ?? "";

    if (0 >= fontFileId && !z.string().url().safeParse(url).success) {
      logger.error("Invalid input", url, fontFileId);
      return;
    }

    const fontFaceData = {
      name: formData.name,
      weight:
        (formData.fontWeight as number) > 0 ? formData.fontWeight : undefined,
      style:
        formData.fontStyle && formData.fontStyle.length > 0
          ? formData.fontStyle
          : undefined,
      ...(fontFileId ? { fontFileId } : { url }),
    };

    startTransition(async () => {
      const actionFont =
        fontFaceId && fontFace
          ? actions.font.updateFontFace(fontFaceId, fontFaceData)
          : actions.font.createFontFace(fontFamilyId, fontFaceData);

      const result = await actionFont.then(safeParse);

      if (result.success) {
        logger.log("success");
      } else {
        logger.log("failed");
      }
    });

    onChange({
      name: formData.name,
      fontWeight: formData.fontWeight,
      fontStyle: formData.fontStyle,
      ...(fontFileId ? { fontFileId } : { url }),
    } as types.FontFace);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent
        sx={{
          width: 400,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography size="large" sx={{ fontWeight: 600, mb: 0.5 }}>
            {fontFace ? "Edit Font Face" : "New Font Face"}
          </Typography>
          <Typography size="small" sx={{ color: "text.secondary" }}>
            {fontFace
              ? "Update the properties of this font face."
              : "Define a font face by specifying its weight, style, and source file."}
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <FormControl fullWidth>
              <FormLabel>Name</FormLabel>
              <Input
                name="font-face-name"
                size="medium"
                value={fontFace?.name ?? " "}
                onChange={(value) => {
                  //formRef.current.name = value;
                  setFormData((prev) => ({
                    ...prev,
                    name: value,
                  }));
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Weight</FormLabel>
              <Select
                size="medium"
                enum={[
                  { label: "No value", value: 0 },
                  { label: "100", value: 100 },
                  { label: "200", value: 200 },
                  { label: "300", value: 300 },
                  { label: "400", value: 400 },
                  { label: "500", value: 500 },
                  { label: "600", value: 600 },
                  { label: "700", value: 700 },
                  { label: "800", value: 800 },
                  { label: "900", value: 900 },
                ]}
                value={fontFace?.fontWeight || 0}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    fontWeight: parseInt(
                      value as string
                    ) as types.FontFace["fontWeight"],
                  }));
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Style</FormLabel>
              <Select
                size="medium"
                enum={[
                  { label: "No value", value: "" },
                  { label: "normal", value: "normal" },
                  { label: "italic", value: "italic" },
                ]}
                value={fontFace?.fontStyle ?? ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    fontStyle: value as types.FontFace["fontStyle"],
                  }));
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>URL</FormLabel>
              {!fontFace || fontFace?.fontFileId ? (
                <SelectWPPost
                  freeSolo
                  size="medium"
                  onChange={(post) => {
                    // If post.ID is 0, it means the user has selected a custom font file
                    // and we need to set the URL from post.post title
                    // Otherwise, we set the fontFileId to the selected post ID
                    setFormData((prev) => ({
                      ...prev,
                      fontFileId: post.ID || 0,
                      url: post.ID === 0 ? post.post_title : "",
                    }));
                  }}
                  postOptions={{
                    postTypes: ["attachment"],
                    mimeTypes: ["ttf", "woff", "woff2"],
                  }}
                  defaultValue={fontFace?.fontFileId}
                />
              ) : (
                <Input
                  size="medium"
                  value={fontFace?.url}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      url: value,
                    }));
                  }}
                />
              )}
            </FormControl>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button size="medium" type="submit" loading={loading}>
                {fontFace ? "Save" : "Create"}
              </Button>
              <Button
                size="medium"
                onClick={handleClose}
                disabled={loading}
                color="error"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </form>
      </ModalContent>
    </Modal>
  );
};
