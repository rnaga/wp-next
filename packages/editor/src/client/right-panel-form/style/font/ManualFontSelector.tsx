import { useEffect, useState, useTransition } from "react";
import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectedNode } from "../../../global-event";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { updateCSSTypography } from "../../../../lexical/styles/typography";
import { $getCSSTypography } from "../../../../lexical/styles/typography";
import { NODE_PROPERTY_UPDATED } from "../../../node-event";
import { $getNodeByKey, COMMAND_PRIORITY_HIGH } from "lexical";

export const ManualFontSelector = (props: { onClose: VoidFunction }) => {
  const { onClose } = props;
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [value, setValue] = useState("");
  const [loading, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!selectedNode) {
      return;
    }

    startTransition(async () => {
      await updateCSSTypography(editor, selectedNode, "raw", {
        fontFamily: value,
      });

      // Re-read the persisted value from the editor after submit so that
      // reopening the box always reflects the actual saved state.
      updateValue();
      onClose();
    });
  };

  /**
   * Reads the current fontFamily from the editor and syncs it into local state.
   * Always resets to "" when no raw typography is found, so stale state from
   * a previous open never persists after the user clears the value and submits.
   */
  const updateValue = () => {
    const cssTypography = selectedNode
      ? editor.read(() => $getCSSTypography(selectedNode.getLatest()))
      : null;

    if (cssTypography && cssTypography.$type === "raw") {
      setValue(cssTypography.fontFamily ?? "");
    } else {
      setValue("");
    }
  };

  useEffect(() => {
    updateValue();
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (node === selectedNode) {
          updateValue();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <InputMultiple
        onChange={(value) => {
          setValue(value.join(","));
        }}
        value={value.split(",")}
        size="small"
        slotSxProps={{
          textField: {
            fontSize: 14,
          },
        }}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        size="small"
        variant="contained"
        disableElevation
        disabled={loading}
      >
        Submit
      </Button>
    </Box>
  );
};
