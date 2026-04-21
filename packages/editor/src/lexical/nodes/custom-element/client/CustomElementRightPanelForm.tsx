import { useEffect, useRef, useState } from "react";

import { Box, CircularProgress } from "@mui/material";
import { useSelectedNode } from "../../../../client/global-event";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HelpText } from "../../../../client/forms/components/HelpText";
import {
  $syncCollectionElementNodesInCollection,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import { Input } from "@rnaga/wp-next-ui/Input";
import { $loadTemplateText } from "../../template-text/TemplateTextNode";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { DataInputEndDecorator } from "../../../../client/forms/components/DataInputEndDecorator";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";
import {
  $isCustomElementNode,
  HTMLContainerElementTag,
  SerializedCustomElementNode,
} from "../CustomElementNode";
import { HTML_CONTAINER_ELEMENT_TAGS } from "../constants";

export const CustomElementRightPanelForm = (props: {
  children?: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [type, setType] = useState<HTMLContainerElementTag>("div");

  const handleTypeChange = (value?: string) => {
    if (!value) return;

    const type = value as HTMLContainerElementTag;
    setType(type);

    if (!selectedNode || !$isCustomElementNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__elementType = type;

        $syncParentCollections(writable);
      },
      {
        discrete: true,
      }
    );

    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: selectedNode, //editor.read(() => selectedNode.getLatest()),
    });
  };

  useEffect(() => {
    if (!selectedNode || !$isCustomElementNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setType(latestNode.__elementType);
  }, [selectedNode]);

  if (!selectedNode || !$isCustomElementNode(selectedNode)) {
    return null;
  }

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        mb: 20,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <RightPanelSectionTitle title="General Settings" />
      </Box>

      <RightFormBox title="Element Tag">
        <SelectAutocomplete
          value={type}
          items={HTML_CONTAINER_ELEMENT_TAGS.map((tag) => ({
            label: tag,
            value: tag,
          }))}
          onChange={handleTypeChange}
          sx={{
            width: "100%",
          }}
          slotProps={{
            input: {
              width: "100%",
            },
          }}
        />
        <HelpText>Select the HTML element tag.</HelpText>
      </RightFormBox>

      <SettingsRightPanelForm isChild />
    </Box>
  );
};
