import { ControlledBubbleMenu, useRichTextEditorContext } from "mui-tiptap";
import { useEffect, useRef, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Editor } from "@tiptap/core";

const ViewMediaMenu = (props: { editor: Editor; onEdit: () => void }) => {
  const { editor, onEdit } = props;

  if (!editor) {
    return null;
  }
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        m: 1,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 400,
        }}
      >
        {editor.getAttributes("image").src || "No image selected"}
      </Typography>

      <Tooltip title="Settings">
        <IconButton>
          <SettingsIcon
            onClick={() => {
              onEdit();
            }}
          />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton
          onClick={() => {
            editor.commands.deleteSelection();
          }}
        >
          <DeleteIcon color="error" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const EditMediaMenu = (props: {
  editor: Editor;
  onCancel: () => void;

  onEdit: () => void;
}) => {
  const { editor, onCancel, onEdit } = props;
  const srcRef = useRef<string>(editor.getAttributes("image").src);
  return (
    <Box
      sx={{
        p: 2,

        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 400,
        width: "100%",
      }}
    >
      <FormControl>
        <FormLabel title="Image URL">
          <Input
            size="medium"
            value={srcRef.current}
            onChange={(value) => {
              srcRef.current = value;
            }}
            sx={{
              width: "100%",
            }}
          />
        </FormLabel>
      </FormControl>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            editor.chain().focus().setImage({ src: srcRef.current }).run();
            onEdit();
          }}
        >
          Save
        </Button>

        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => {
            // Placeholder for cancel action
            onCancel();
          }}
          sx={{ ml: 1 }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export const MediaBubbleMenu = () => {
  const editor = useRichTextEditorContext();
  const [menuState, setMenuState] = useState<"view" | "edit">("view");

  //   const element = editor.view.dom.querySelector("img");
  //   const computedStyle = window.getComputedStyle(element);

  useEffect(() => {
    if (editor) {
      // Ensure the menu state is set to "view" when an image is selected.
      // This keeps the menu in sync with the editor's selection state.
      editor.on("selectionUpdate", () => {
        if (!editor.isActive("image") && menuState !== "view") {
          setMenuState("view");
        }
      });
    }
  }, [editor, menuState]);

  if (!editor) {
    return null;
  }

  return (
    <ControlledBubbleMenu
      editor={editor}
      open={editor.isActive("image")}
      placement="top-start"
    >
      {menuState === "view" ? (
        <ViewMediaMenu editor={editor} onEdit={() => setMenuState("edit")} />
      ) : (
        <EditMediaMenu
          editor={editor}
          onCancel={() => setMenuState("view")}
          onEdit={() => setMenuState("view")}
        />
      )}
    </ControlledBubbleMenu>
  );
};
