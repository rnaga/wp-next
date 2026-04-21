import { useEffect, useRef, useState } from "react";

import { Box, CircularProgress } from "@mui/material";
import { useSelectedNode } from "../../../../client/global-event";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import {
  $isLinkNode,
  $loadTemplateLink,
  SerializedLinkNode,
} from "../LinkNode";
import { Select } from "@rnaga/wp-next-ui/Select";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HelpText } from "../../../../client/forms/components/HelpText";
import {
  $syncCollectionElementNodesInCollection,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import { Input } from "@rnaga/wp-next-ui/Input";
import { DataInputEndDecorator } from "../../../../client/forms/components";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";

export const LinkRightPanelForm = (props: { children?: React.ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [href, setHref] = useState<SerializedLinkNode["__href"]>("#");
  const [target, setTarget] = useState<SerializedLinkNode["__target"]>("_self");

  const handleHrefChange = (value?: string) => {
    if (!value) return;

    const href = value as SerializedLinkNode["__href"];
    setHref(href);

    if (!selectedNode || !$isLinkNode(selectedNode)) {
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

    const target = value as SerializedLinkNode["__target"];
    setTarget(target);

    if (!selectedNode || !$isLinkNode(selectedNode)) {
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
    if (!selectedNode || !$isLinkNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setHref(latestNode.__href);
    setTarget(latestNode.__target);
  }, [selectedNode]);

  if (!selectedNode || !$isLinkNode(selectedNode)) {
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
      <Box sx={{ width: "100%", my: 1 }}>
        <RightPanelSectionTitle title="General Settings" />
      </Box>

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

      <RightFormBox title="Link Target">
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
