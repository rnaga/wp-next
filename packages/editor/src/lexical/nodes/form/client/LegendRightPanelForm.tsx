import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $isLegendNode } from "../LegendNode";
import { $updateLegendText } from "../input";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";

export const LegendRightPanelForm = (props: { children?: React.ReactNode }) => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const [legendText, setLegendText] = useState<string>();

  const handleLegendTextChange = (legendText?: string) => {
    if (!selectedNode || !$isLegendNode(selectedNode)) return;

    editor.update(
      () => {
        $updateLegendText(selectedNode, legendText || " ");

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: selectedNode.getLatest(),
        });
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!selectedNode || !$isLegendNode(selectedNode)) {
      return;
    }

    const legendText = editor.read(() => selectedNode.getLegendText());
    setLegendText(legendText || " ");
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
      }}
    >
      <Box
        sx={{
          width: "100%",
        }}
      >
        <RightPanelSectionTitle title="Legend Text" />
        <Input
          key="legend-text"
          type="text"
          onChange={handleLegendTextChange}
          value={legendText || " "}
          sx={{
            width: "100%",
          }}
        />
      </Box>

      {props.children}
    </Box>
  );
};
