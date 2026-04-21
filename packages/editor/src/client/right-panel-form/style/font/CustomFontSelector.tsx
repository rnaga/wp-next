import { Box, List, ListItem } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useEffect, useRef, useState, useTransition } from "react";
import { useSelectedNode } from "../../../global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { CustomFontModal } from "../../../custom-font/CustomFontModal";
import { Button } from "@rnaga/wp-next-ui/Button";
import { updateCSSTypography } from "../../../../lexical/styles/typography";
import {
  CUSTOM_FONT_FAMILY_CREATED_COMMAND,
  CUSTOM_FONT_FAMILY_DELETED_COMMAND,
} from "../../../custom-font/commands";
import { addWPHooksActionCommands } from "../../../event-utils/add-commands";

export const CustomFontSelector = (props: { onClose: VoidFunction }) => {
  const { onClose } = props;
  const [openModal, setOpenModal] = useState(false);
  const [fontFamilies, setFontFamilies] = useState<wpCoreTypes.actions.Posts>(
    []
  );
  const { actions, parse } = useEditorServerActions();
  const { wpHooks } = useWP();
  const [loading, startTransition] = useTransition();

  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const customFontRef = useRef<HTMLElement | null>(null);

  const loadFonts = async (fonts: wpCoreTypes.actions.Posts) => {
    if (0 === fonts.length) {
      return;
    }

    const css = await actions.font.getCssFontFaces(
      fonts.map((font) => font.post_name)
    );

    // Reuse a single style tag to avoid accumulating duplicates on re-renders.
    const STYLE_ID = "custom-font-faces";
    const head = document.head;
    let style = head.querySelector<HTMLStyleElement>(`style#${STYLE_ID}`);

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      head.appendChild(style);
    }

    style.textContent = css;
  };

  // Initial load and re-fetch when a font family is created or deleted via FontFamilies.tsx.
  useEffect(() => {
    /** Fetches the full custom font list and injects @font-face CSS. */
    const fetchFonts = () => {
      startTransition(async () => {
        const [fonts] = await actions.font
          .list({
            per_page: 100,
          })
          .then(parse);

        await loadFonts(fonts);
        setFontFamilies(fonts);
      });
    };

    fetchFonts();

    return addWPHooksActionCommands(
      wpHooks,
      [CUSTOM_FONT_FAMILY_CREATED_COMMAND, CUSTOM_FONT_FAMILY_DELETED_COMMAND],
      () => fetchFonts()
    );
  }, []);

  const handleSelectFont = async (
    fontFamily: wpCoreTypes.actions.Posts[number]
  ) => {
    if (!selectedNode) {
      return;
    }

    await updateCSSTypography(editor, selectedNode, "custom", {
      fontFamily: fontFamily.post_title,
      $slug: fontFamily.post_name,
    });
    onClose();
  };

  return (
    <>
      <CustomFontModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        ref={customFontRef}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {fontFamilies.length === 0 && (
          <Typography
            size="medium"
            sx={{
              padding: 1,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            No fonts available
          </Typography>
        )}
        <List
          disablePadding
          sx={{
            maxHeight: 250,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {fontFamilies.map((font, index) => (
            <ListItem
              key={index}
              disablePadding
              sx={{
                cursor: "pointer",
                px: 1.5,
                py: 0.5,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
              onClick={() => {
                handleSelectFont(font);
              }}
            >
              <Typography
                size="small"
                sx={{
                  fontFamily: font.post_title,
                  lineHeight: 1.5,
                }}
              >
                {font.post_title}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Button
          type="button"
          onClick={() => setOpenModal(true)}
          size="small"
          variant="contained"
          disableElevation
          sx={{
            marginTop: 1,
            width: "100%",
            textTransform: "none",
          }}
        >
          Manage Custom Font
        </Button>
      </Box>
    </>
  );
};
