import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";

import { DataInputEndDecorator } from "../../../../client/forms/components";
import { HelpText } from "../../../../client/forms/components/HelpText";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { $loadTemplateLink } from "../../link/LinkNode";
import { $isButtonLinkNode, SerializedButtonLinkNode } from "../ButtonLinkNode";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";

export const ButtonLinkRightPanelForm = (props: {
  children?: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [href, setHref] = useState<SerializedButtonLinkNode["__href"]>("#");
  const [target, setTarget] =
    useState<SerializedButtonLinkNode["__target"]>("_self");
  const [label, setLabel] =
    useState<SerializedButtonLinkNode["__label"]>("Button");

  const handleLabelChange = (value?: string) => {
    if (!value) return;

    const label = value as SerializedButtonLinkNode["__label"];
    setLabel(label);

    if (!selectedNode || !$isButtonLinkNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__label = label;

        $loadTemplateLink(writable);
      },
      {
        discrete: true,
      }
    );

    // Trigger command to notify node property updated, which will update mouse tool in preview layer.
    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: selectedNode,
    });
  };

  const handleHrefChange = (value?: string) => {
    if (!value) return;

    const href = value as SerializedButtonLinkNode["__href"];
    setHref(href);

    if (!selectedNode || !$isButtonLinkNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__href = href;

        $loadTemplateLink(writable);
      },
      {
        discrete: true,
      }
    );
  };

  const handleTargetChange = (value?: string) => {
    if (!value) return;

    const target = value as SerializedButtonLinkNode["__target"];
    setTarget(target);

    if (!selectedNode || !$isButtonLinkNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__target = target;

        $syncParentCollections(writable);
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!selectedNode || !$isButtonLinkNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setHref(latestNode.__href);
    setTarget(latestNode.__target);
    setLabel(latestNode.__label);
  }, [selectedNode]);

  if (!selectedNode || !$isButtonLinkNode(selectedNode)) {
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
      <RightFormBox title="Label">
        <Input
          value={label}
          onChange={handleLabelChange}
          placeholder="Enter button label"
          sx={{
            width: "100%",
          }}
          endAdornment={
            <DataInputEndDecorator
              onClick={(dataValue) => {
                const dataVariable = `\${${dataValue}}`;
                const newLabel = label + dataVariable;
                handleLabelChange(newLabel);
              }}
            />
          }
        />
      </RightFormBox>

      <RightFormBox title="Link URL">
        <Input
          value={href}
          onChange={handleHrefChange}
          placeholder="https://example.com"
          sx={{
            width: "100%",
          }}
          endAdornment={
            <DataInputEndDecorator
              onClick={(dataValue) => {
                const dataVariable = `\${${dataValue}}`;
                const newHref = href + dataVariable;
                handleHrefChange(newHref);
              }}
            />
          }
        />
      </RightFormBox>

      <RightFormBox title="Target">
        <Select
          value={target}
          onChange={handleTargetChange}
          enum={[
            { value: "_self", label: "Same Tab" },
            { value: "_blank", label: "New Tab" },
            { value: "_parent", label: "Parent Frame" },
            { value: "_top", label: "Full Body" },
          ]}
        />
        <HelpText>Select how the link should open when clicked.</HelpText>
      </RightFormBox>

      <SettingsRightPanelForm isChild />
    </Box>
  );
};
