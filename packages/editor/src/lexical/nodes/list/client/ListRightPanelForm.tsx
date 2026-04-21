import { useEffect, useRef, useState } from "react";

import { Box, CircularProgress } from "@mui/material";
import { useSelectedNode } from "../../../../client/global-event";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { $isListNode, SerializedListNode } from "../ListNode";
import { ButtonGroup } from "../../../../client/forms/components/ButtonGroup";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HelpText } from "../../../../client/forms/components/HelpText";
import {
  $syncCollectionElementNodesInCollection,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";

export const ListRightPanelForm = (props: { children?: React.ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [display, setDisplay] =
    useState<SerializedListNode["__listType"]>("ul");
  const [enableBullets, setEnableBullets] = useState<boolean>(true);

  const handleTypeChange = (value?: string) => {
    if (!value) return;

    const listType = value as SerializedListNode["__listType"];
    setDisplay(listType);

    if (!selectedNode || !$isListNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__listType = listType;

        $syncParentCollections(writable);
      },
      {
        discrete: true,
      }
    );
  };

  const handleEnableBulletsChange = (value?: string) => {
    if (!value) return;

    const withBullets = value === "on" ? true : false;
    setEnableBullets(withBullets);

    if (!selectedNode || !$isListNode(selectedNode)) {
      return;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__withBullets = withBullets;

        $syncParentCollections(writable);
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!selectedNode || !$isListNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setDisplay(latestNode.__listType);
    setEnableBullets(latestNode.__withBullets);
  }, [selectedNode]);

  if (!selectedNode || !$isListNode(selectedNode)) {
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
        <Box sx={{ width: "100%" }}>
          <RightPanelSectionTitle title="Appearance" />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            width: "100%",
          }}
        >
          <ButtonGroup
            value={display}
            onChange={handleTypeChange}
            enum={[
              { value: "ul", label: "Bullet" },
              { value: "ol", label: "Number" },
            ]}
          />
          <HelpText>Configure the list appearance settings.</HelpText>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            width: "100%",
          }}
        >
          <ButtonGroup
            value={enableBullets ? "on" : "off"}
            onChange={handleEnableBulletsChange}
            enum={[
              { value: "on", label: "Show" },
              { value: "off", label: "Hide" },
            ]}
          />
          <HelpText>
            Enable or disable the display of bullets for the list items.
          </HelpText>
        </Box>
      </Box>
      <SettingsRightPanelForm isChild />
    </Box>
  );
};
