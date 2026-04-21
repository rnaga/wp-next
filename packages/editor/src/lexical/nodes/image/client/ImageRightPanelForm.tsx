import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";

import { MediaSelector } from "../../../../client/forms/components";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $loadTemplateText } from "../../template-text/TemplateTextNode";
import { $isImageNode } from "../ImageNode";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";

export const ImageRightPanelForm = () => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const [mediaUrl, setMediaUrl] = useState<string>();

  const handleChange = (url?: string) => {
    if (!selectedNode) return;
    if (!$isImageNode(selectedNode)) return;

    setMediaUrl(url ?? "");
    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.setSettings({
          ...writable.getSettings(),
          url,
        });
        $loadTemplateText(writable);
        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!$isImageNode(selectedNode)) {
      return;
    }

    setMediaUrl(selectedNode.getSettings().url);
  }, []);

  if (!selectedNode) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
      }}
    >
      <Box sx={{ width: "100%", my: 1 }}>
        <RightPanelSectionTitle title="General Settings" />
      </Box>

      <MediaSelector onChange={handleChange} mediaUrl={mediaUrl} size="small" />

      <SettingsRightPanelForm isChild />
    </Box>
  );
};
