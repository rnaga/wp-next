import { useEffect, useMemo, useState, useTransition } from "react";
import { logger } from "../../lexical/logger";

import { Box, FormControl } from "@mui/material";
import { TreeItem } from "@mui/x-tree-view";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import * as types from "../../types";
import { BasicIconMenuButton } from "../forms/components/BasicIconMenuButton";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { FontFace } from "./FontFace";
import { useCustomFont } from "./CustomFontModal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import {
  CUSTOM_FONT_FAMILY_CREATED_COMMAND,
  CUSTOM_FONT_FAMILY_DELETED_COMMAND,
} from "./commands";

type OpenState =
  | "close"
  | "create"
  | "edit"
  | "delete-font-family"
  | "open-font-face"
  | "delete-font-face";

const EditFontFamily = (props: {
  open: OpenState;
  setOpen: (open: OpenState) => void;
  fontFamily?: wpCoreTypes.actions.Posts[number];
  loading: boolean;
  onCreate: (name: string) => void;
}) => {
  const { open, setOpen, loading, onCreate } = props;

  return (
    <Modal
      open={open === "create" || open === "edit"}
      onClose={() => setOpen("close")}
    >
      <ModalContent
        sx={{
          width: 360,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography size="large" sx={{ fontWeight: 600, mb: 0.5 }}>
            {open === "edit" ? "Rename Font Family" : "New Font Family"}
          </Typography>
          <Typography size="small" sx={{ color: "text.secondary" }}>
            {open === "edit"
              ? "Enter a new name for this font family."
              : "Enter a name for the new font family."}
          </Typography>
        </Box>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // skip if no value
            const value = (e.target as any).elements[0]?.value;
            if (!value) {
              return;
            }
            onCreate(value);
          }}
        >
          <FormControl
            fullWidth
            sx={{
              gap: 2,
            }}
          >
            <Input
              placeholder="Font family name"
              name="font-family"
              size="large"
              value={props.fontFamily?.post_title}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button size="medium" type="submit" loading={loading}>
                {open === "edit" ? "Save" : "Create"}
              </Button>
              <Button
                size="medium"
                onClick={() => setOpen("close")}
                disabled={loading}
                color="error"
              >
                Cancel
              </Button>
            </Box>
          </FormControl>
        </form>
      </ModalContent>
    </Modal>
  );
};

export const FontFamilies = () => {
  const { actions, safeParse, parse } = useEditorServerActions();
  const { wpHooks } = useWP();
  const [loading, startTransition] = useTransition();

  const { fontFamilies, setFontFamilies } = useCustomFont();

  const [open, setOpen] = useState<OpenState>("close");
  const [selectedFontFamily, setSelectedFontFamily] =
    useState<wpCoreTypes.actions.Posts[number]>();

  const [selectedFontFace, setSelectedFontFace] = useState<
    types.FontFace | undefined
  >(undefined);

  const list = async () => {
    const [fontFamilities, info] = await actions.font.list().then(parse);
    const fontFaceMap = info?.fontFaceMap;

    return { fontFamilities, fontFaceMap };
  };

  const getFontFaces = (fontFamilyId: number) => {
    logger.log("getFontFaces", fontFamilyId, fontFamilies?.map?.[fontFamilyId]);
    return fontFamilies.map?.[fontFamilyId] || [];
  };

  const handleEditFontFamily = async (newName: string) => {
    if (open === "create") {
      startTransition(async () => {
        // create returns the new post ID
        const [fontFamilyId] = await actions.font.create(newName).then(parse);

        if (fontFamilyId) {
          const { fontFamilities, fontFaceMap = {} } = await list();
          setFontFamilies({ families: fontFamilities, map: fontFaceMap });

          // Find the full post record from the refreshed list so listeners
          // receive the complete font family object.
          const created = fontFamilities?.find((f) => f.ID === fontFamilyId);
          if (created) {
            wpHooks.action.doCommand(CUSTOM_FONT_FAMILY_CREATED_COMMAND, {
              fontFamily: created,
            });
          }
        }

        handleClose();
      });

      return;
    }

    if (!selectedFontFamily) {
      return;
    }

    startTransition(async () => {
      const fontFamilyId = selectedFontFamily.ID;
      const result = await actions.font
        .update(fontFamilyId, newName)
        .then(safeParse);

      if (result.success) {
        const { fontFamilities, fontFaceMap = {} } = await list();
        setFontFamilies({ families: fontFamilities, map: fontFaceMap });
      }

      handleClose();
    });
  };

  const handleClose = () => {
    setOpen("close");
    setSelectedFontFamily(undefined);
    setSelectedFontFace(undefined);
  };

  const handleMenuClick = (
    fontFamily: wpCoreTypes.actions.Posts[number],
    value: string
  ) => {
    if (value === "rename") {
      setOpen("edit");
    }

    if (value === "delete") {
      setOpen("delete-font-family");
    }

    if (value === "create-font-face") {
      setOpen("open-font-face");
      // Handle add font face action
    }

    setSelectedFontFamily(fontFamily);
  };

  const handleFontFaceMenuClick = (
    fontFamily: wpCoreTypes.actions.Posts[number],
    fontFace: types.FontFace,
    value: string
  ) => {
    if (value === "edit") {
      setOpen("open-font-face");
    }

    if (value === "delete") {
      setOpen("delete-font-face");
    }

    setSelectedFontFamily(fontFamily);
    setSelectedFontFace(fontFace);
  };

  const handleDeleteFontFamily = async (confirm: boolean) => {
    if (!confirm || !selectedFontFamily) {
      handleClose();
      return;
    }

    const fontFamilyId = selectedFontFamily.ID;

    startTransition(async () => {
      const result = await actions.font.del(fontFamilyId).then(safeParse);
      if (result.success) {
        const { fontFamilities, fontFaceMap = {} } = await list();
        setFontFamilies({ families: fontFamilities, map: fontFaceMap });

        // Notify listeners of the deleted font family ID so they can remove it from their state.
        wpHooks.action.doCommand(CUSTOM_FONT_FAMILY_DELETED_COMMAND, {
          fontFamily: selectedFontFamily,
        });
      }
    });

    handleClose();
  };

  const handleDeleteFontFace = async (confirm: boolean) => {
    if (!confirm || !selectedFontFace) {
      handleClose();
      return;
    }
    const fontFaceId = selectedFontFace.ID;
    startTransition(async () => {
      const result = await actions.font.delFontFace(fontFaceId).then(safeParse);
      if (result.success) {
        const { fontFamilities, fontFaceMap = {} } = await list();
        setFontFamilies({ families: fontFamilities, map: fontFaceMap });
      }
    });
    handleClose();
  };

  const handleFontFaceSubmit = () => {
    startTransition(async () => {
      const { fontFamilities, fontFaceMap = {} } = await list();
      setFontFamilies({ families: fontFamilities, map: fontFaceMap });
    });
    handleClose();
  };

  useEffect(() => {
    if (fontFamilies?.families?.length && fontFamilies.families.length > 0) {
      return;
    }

    startTransition(async () => {
      const { fontFamilities, fontFaceMap = {} } = await list();
      setFontFamilies({ families: fontFamilities, map: fontFaceMap });
    });
  }, []);

  return (
    <>
      <ModalConfirm
        title="Confirm Delete"
        message="Are you sure you want to proceed with this action?"
        open={open === "delete-font-family" || open === "delete-font-face"}
        onClose={() => setOpen("close")}
        callback={
          open === "delete-font-family"
            ? handleDeleteFontFamily
            : handleDeleteFontFace
        }
      />
      {selectedFontFamily && (
        <FontFace
          open={open === "open-font-face"}
          onClose={handleClose}
          onChange={handleFontFaceSubmit}
          fontFamilyId={selectedFontFamily?.ID}
          fontFace={selectedFontFace}
        />
      )}

      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {loading && open !== "edit" ? (
          <div>Loading...</div>
        ) : fontFamilies?.families?.length ? (
          <SimpleTreeView
            sx={{
              width: "100%",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {fontFamilies.families.map((fontFamily) => (
              <TreeItem
                itemId={`${fontFamily.ID}`}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography size="medium" bold>
                      {fontFamily.post_title}
                    </Typography>
                    <BasicIconMenuButton
                      size="medium"
                      onChange={(value) => handleMenuClick(fontFamily, value)}
                      items={[
                        { label: "Rename", value: "rename" },
                        { label: "Delete", value: "delete" },
                        {
                          label: "Create Font Face",
                          value: "create-font-face",
                        },
                      ]}
                    />
                  </Box>
                }
                key={fontFamily.ID}
              >
                {getFontFaces(fontFamily.ID).map((fontFace) => (
                  <TreeItem
                    key={fontFace.ID}
                    itemId={`${fontFace.ID}`}
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "start",
                            gap: 1,
                          }}
                        >
                          <Typography
                            size="medium"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 100,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fontFace.name}
                          </Typography>
                          <Typography
                            size="medium"
                            sx={{
                              "&::after": {
                                content: `" ${
                                  fontFace.fontWeight || "No value"
                                }"`,
                                fontWeight: 600,
                              },
                            }}
                          >
                            | Weight:
                          </Typography>
                          <Typography
                            size="medium"
                            sx={{
                              "&::after": {
                                content: `" ${
                                  fontFace.fontStyle || "No value"
                                }"`,
                                fontWeight: 600,
                              },
                            }}
                          >
                            | Style:
                          </Typography>
                        </Box>
                        <BasicIconMenuButton
                          size="medium"
                          onChange={(value) =>
                            handleFontFaceMenuClick(fontFamily, fontFace, value)
                          }
                          items={[
                            { label: "Edit", value: "edit" },
                            { label: "Delete", value: "delete" },
                          ]}
                        />
                      </Box>
                    }
                  />
                ))}
              </TreeItem>
            ))}
          </SimpleTreeView>
        ) : (
          <Box sx={{ flex: 1, textAlign: "center", py: 4 }}>
            <Typography size="medium" sx={{ color: "text.secondary", mb: 1 }}>
              No font families yet.
            </Typography>
            <Typography size="small" sx={{ color: "text.secondary" }}>
              Create a font family, then add font faces to define weights and
              styles.
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            textAlign: "center",
            mt: 1.5,
          }}
        >
          <Button size="medium" onClick={() => setOpen("create")}>
            Create Font Family
          </Button>
          <EditFontFamily
            open={open}
            setOpen={setOpen}
            loading={loading}
            onCreate={handleEditFontFamily}
            fontFamily={selectedFontFamily}
          />
        </Box>
      </Box>
    </>
  );
};
