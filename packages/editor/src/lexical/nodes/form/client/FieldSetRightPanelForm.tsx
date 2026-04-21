import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useSelectedNode } from "../../../../client/global-event";
import { $isFieldSetNode } from "../FieldSetNode";
import { $isLegendNode } from "../LegendNode";
import { InputListPanel } from "./InputListPanel";
import { $updateLegendText } from "../input";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";

export const FieldSetRightPanelForm = (props: {
  children?: React.ReactNode;
}) => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const [legendText, setLegendText] = useState<string>();

  const handleLegendTextChange = (legendText?: string) => {
    if (!selectedNode || !$isFieldSetNode(selectedNode)) return;

    editor.update(
      () => {
        $updateLegendText(selectedNode, legendText || " ");
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!selectedNode || !$isFieldSetNode(selectedNode)) {
      return;
    }

    const text = editor.read(() => {
      const legendNode = selectedNode.getChildren().find($isLegendNode);
      return legendNode?.getLegendText() || " ";
    });
    setLegendText(text);
  }, [selectedNode, editor]);

  if (!selectedNode || !$isFieldSetNode(selectedNode)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        mb: 20,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "flex-start",
          mb: 1,
          flexDirection: "column",
          gap: 2,
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
        <InputListPanel formNodeOrFieldSetNode={selectedNode} />

        {props.children}
      </Box>
    </Box>
  );
};
