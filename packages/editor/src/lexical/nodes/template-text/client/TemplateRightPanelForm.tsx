import { useEffect, useState } from "react";

import { Box } from "@mui/material";

import { RichtextareaDataInput } from "../../../../client/forms/components/RichtextareaDataInput";
import { DraggableTemplateEditor } from "./DraggableTemplateEditor";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { useTemplateText } from "./use-template-text";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { HTML_CONTAINER_ELEMENT_TAGS } from "../constants";
import { HelpText } from "../../../../client/forms/components/HelpText";
import {
  $isTemplateTextNode,
  HTMLContainerElementTag,
} from "../TemplateTextNode";
import { useSelectedNode } from "../../../../client/global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event/commands";

export const TemplateRightPanelForm = () => {
  const { template, handleChange } = useTemplateText();
  const [editor] = useLexicalComposerContext();
  const [openDraggable, setOpenDraggable] = useState(false);
  const { selectedNode } = useSelectedNode();

  const [type, setType] = useState<HTMLContainerElementTag>("div");

  const handleTypeChange = (value?: string) => {
    if (!value) return;

    const type = value as HTMLContainerElementTag;
    setType(type);

    if (!selectedNode || !$isTemplateTextNode(selectedNode)) {
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
    if (!selectedNode || !$isTemplateTextNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setType(latestNode.__elementType as HTMLContainerElementTag);
  }, [selectedNode]);

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        mb: 20,
      }}
    >
      <DraggableTemplateEditor
        open={openDraggable}
        onClose={() => setOpenDraggable(false)}
        defaultContent={template}
        onUpdate={(html) => {
          handleChange(html);
        }}
      />

      <Box sx={{ width: "100%" }}>
        <RightPanelSectionTitle title="General Settings" />
      </Box>

      <Box
        sx={{
          border: "1px solid #8e8e8eff",
          borderRadius: 1,
          mb: 1.5,
        }}
      >
        <RichtextareaDataInput
          fontSize={11}
          minHeight={200}
          menuSize="small"
          defaultContent={template}
          onUpdate={(html) => {
            handleChange(html);
          }}
          showExpandButton={true}
          onExpandClick={() => setOpenDraggable(true)}
          showDataInputDecorator={true}
        />
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
        {/^h[1-6]$/.test(type) && (
          <HelpText sx={{ mt: 0.5, color: "warning.main" }}>
            Heading tags (h1–h6) only support plain text. Do not use them when
            the template may produce HTML containing block-level elements (e.g.
            post content). Use div or section instead.
          </HelpText>
        )}
      </RightFormBox>

      <SettingsRightPanelForm isChild />
    </Box>
  );
};
