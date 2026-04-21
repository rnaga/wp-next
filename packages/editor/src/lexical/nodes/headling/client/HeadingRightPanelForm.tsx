import { useEffect, useState } from "react";
import { COMMAND_PRIORITY_HIGH } from "lexical";

import { Box } from "@mui/material";
import { useSelectedNode } from "../../../../client/global-event";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";

import { ButtonGroup } from "../../../../client/forms/components/ButtonGroup";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HelpText } from "../../../../client/forms/components/HelpText";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { $isHeadingNode, SerializedHeadingNode } from "../HeadingNode";
import { Input } from "@rnaga/wp-next-ui/Input";
import { $loadTemplateText } from "../../template-text/TemplateTextNode";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { DataInputEndDecorator } from "../../../../client/forms/components/DataInputEndDecorator";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";

export const HeadingRightPanelForm = (props: {
  children?: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [level, setLevel] = useState<SerializedHeadingNode["__level"]>("h1");
  const [template, setTemplate] = useState<string>("");

  const handleLevelChange = (value?: string) => {
    if (!value) return;

    const level = value as SerializedHeadingNode["__level"];
    setLevel(level);

    if (!selectedNode || !$isHeadingNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__level = level;

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

  const handleTemplateChange = (value: string) => {
    if (!$isHeadingNode(selectedNode)) return;

    setTemplate(value);

    editor.update(
      () => {
        const writable = selectedNode?.getWritable();
        if (!writable) return;
        writable.setTemplate(value);
        $loadTemplateText(writable);
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
    if (!selectedNode || !$isHeadingNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setLevel(latestNode.__level);
    setTemplate(latestNode.__template);
  }, [selectedNode]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (node.getKey() !== selectedNode?.getKey()) {
          return false;
        }

        if (!selectedNode || !$isHeadingNode(selectedNode)) {
          return false;
        }

        const latestNode = editor.read(() => selectedNode.getLatest());
        if (!$isHeadingNode(latestNode)) {
          return false;
        }

        setLevel((prev) =>
          prev === latestNode.__level ? prev : latestNode.__level
        );
        setTemplate((prev) =>
          prev === latestNode.__template ? prev : latestNode.__template
        );
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, selectedNode]);

  if (!selectedNode || !$isHeadingNode(selectedNode)) {
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

      <RightFormBox title="Heading Level">
        <ButtonGroup
          value={level}
          onChange={handleLevelChange}
          enum={[
            { value: "h1", label: "H1" },
            { value: "h2", label: "H2" },
            { value: "h3", label: "H3" },
            { value: "h4", label: "H4" },
            { value: "h5", label: "H5" },
            { value: "h6", label: "H6" },
          ]}
          sx={{
            width: "100%",
          }}
        />
        <HelpText>Configure the heading level settings.</HelpText>
      </RightFormBox>

      <RightFormBox title="Heading Text">
        <Input
          value={template}
          onChange={handleTemplateChange}
          placeholder="Enter heading text"
          sx={{
            width: "100%",
          }}
          endAdornment={
            <DataInputEndDecorator
              onClick={(dataValue) => {
                const dataVariable = `\${${dataValue}}`;
                const newTemplate = template + dataVariable;
                handleTemplateChange(newTemplate);
              }}
            />
          }
        />
      </RightFormBox>

      <SettingsRightPanelForm isChild />
    </Box>
  );
};
