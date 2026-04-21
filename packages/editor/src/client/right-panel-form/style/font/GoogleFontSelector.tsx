import { useEffect, useRef } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, List, ListItem } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useGoogleFontsLoader } from "../../../../lexical/nodes/font/client/use-google-fonts-loader";
import { useSelectedNode } from "../../../global-event";

import { Input } from "@rnaga/wp-next-ui/Input";
import { updateCSSTypography } from "../../../../lexical/styles/typography";

export const GoogleFontSelector = (props: { onClose: VoidFunction }) => {
  const { onClose } = props;

  const { loadFonts, fontFamilies } = useGoogleFontsLoader();

  const searchValueRef = useRef<string | null>(null);

  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    loadFonts();
  }, []);

  const handleSelectFont = async (fontFamily: string) => {
    if (!selectedNode) {
      return;
    }

    await updateCSSTypography(editor, selectedNode, "google", {
      fontFamily,
    });
    onClose();
  };

  return (
    <Box>
      <Input
        size="small"
        placeholder="Search font"
        onChange={(value) => {
          loadFonts(value);
          searchValueRef.current = value;
        }}
        sx={{
          width: "100%",
          mb: 1,
        }}
      />

      <List
        disablePadding
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          // Load more fonts when scroll reaches close to bottom plus search box
          // and search box has no value
          if (
            (!searchValueRef.current || 0 === searchValueRef.current.length) &&
            target.scrollHeight - target.scrollTop - target.clientHeight < 50
          ) {
            loadFonts();
          }
        }}
        sx={{
          height: 250,
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
                fontFamily: font,
                lineHeight: 1.5,
              }}
            >
              {font}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
