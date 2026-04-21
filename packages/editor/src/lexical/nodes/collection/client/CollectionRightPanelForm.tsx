import { $getNodeByKey, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";

import {
  collectionDataNameUpdatedEventHandler,
  collectionElementNumberUpdatedEventHandler,
} from "./collection-event-handlers";
import {
  $isCollectionNode,
  $syncCollectionBroadcast,
  $syncParentCollections,
  CollectionNode,
} from "../CollectionNode";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { useSelectedNode } from "../../../../client/global-event";
import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getArrayDataFileKeys,
  getAllArrayKeysFromDataFetchingNodes,
  getArrayKeysInArray,
} from "../../data-fetching/data-fetching-validator-utils";
import {
  FormFlexBox,
  FormStyleControl,
} from "../../../../client/forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Box } from "@mui/material";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { RightFormBox } from "../../../../client/forms/components/RightFormBox";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const SelectData = (props: {
  value: string | null;
  onChange: (value: string | null) => void;
}) => {
  const { value, onChange } = props;
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();

  const [dataFileKeys, setDataFileKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!$isCollectionNode(selectedNode)) return;

    editor.read(() => {
      const arrayKeysFromDataFetchingNodes =
        getAllArrayKeysFromDataFetchingNodes(editor);

      const arrayKeysFromParentCollectionNodes = $getArrayDataFileKeys(
        editor,
        selectedNode
      );

      setDataFileKeys([
        ...arrayKeysFromParentCollectionNodes,
        ...arrayKeysFromDataFetchingNodes,
      ]);

      if (!selectedNode) {
        return;
      }

      // node might've been mutated. Get the latest node
      const collectionNode = $getNodeByKey(
        selectedNode.getKey()
      ) as CollectionNode;
      onChange(collectionNode.getDataName());
    });
  }, [selectedNode]);

  if (dataFileKeys.length === 0) {
    return (
      <Typography color="error">
        No available data. Data Fetching nodes are not defined. Add a Data
        Fetching node that returns array data (e.g. PostsDataFetchingNode) to
        use this collection.
      </Typography>
    );
  }

  return (
    <Select
      key="object-fit"
      onChange={(key) => onChange(key)}
      enum={dataFileKeys.map((key) => ({
        value: key,
        label: key,
      }))}
      value={value}
    />
  );
};

export const CollectionRightPanelForm = () => {
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();

  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [dataName, setDataName] = useState<string | null>(null);
  const [elementMaxLength, setElementMaxLength] = useState<number>(2);
  const [itemName, setItemName] = useState<string>("item");

  useEffect(() => {
    if (!$isCollectionNode(selectedNode)) return;

    setCollectionName(selectedNode.getName());
    setDataName(selectedNode.getDataName());
    setElementMaxLength(selectedNode.getElementMaxLength());
    setItemName(selectedNode.getItemName());
  }, [selectedNode]);

  const handleChangeName = (value: string | null) => {
    setCollectionName(value);

    editor.update(
      () => {
        const writable = selectedNode
          ?.getLatest()
          .getWritable() as CollectionNode;

        writable.setName(value || "");

        $syncCollectionBroadcast(writable);
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  const handleChangeDataName = (value: string | null) => {
    setDataName(value);

    if (!value) return;

    const node = editor.read(() => selectedNode?.getLatest()) as CollectionNode;

    collectionDataNameUpdatedEventHandler({
      node,
      dataName: value,
      editor,
    });

    editor.update(
      () => {
        const latestNode = selectedNode?.getLatest() as CollectionNode;
        $syncCollectionBroadcast(latestNode);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: latestNode,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  const handleChangeElementMaxLength = (value: number | null) => {
    if (!value) return;
    setElementMaxLength(value);

    const node = editor.read(() => selectedNode?.getLatest()) as CollectionNode;

    collectionElementNumberUpdatedEventHandler({
      node,
      elementMaxLength: value,
      editor,
    });

    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node,
    });
  };

  const handleItemNameChange = (value: string) => {
    if (!$isCollectionNode(selectedNode)) return;

    editor.update(
      () => {
        const writable = selectedNode
          ?.getLatest()
          .getWritable() as CollectionNode;

        writable.setItemName(value);

        // Sync parent collections (up the tree)
        $syncCollectionBroadcast(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  if (!$isCollectionNode(selectedNode)) return null;

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

      <RightFormBox title="Collection Name">
        <Input
          key="collection-name"
          type="text"
          onChange={handleChangeName}
          value={collectionName || ""}
          sx={{
            width: "100%",
          }}
        />
      </RightFormBox>
      <RightFormBox title="Target Data">
        <SelectData value={dataName} onChange={handleChangeDataName} />
      </RightFormBox>
      <RightFormBox title="Item Name">
        <Input
          key="item-name"
          type="text"
          onChange={handleItemNameChange}
          value={itemName}
          sx={{
            width: "100%",
          }}
        />
      </RightFormBox>
      <RightFormBox title="Max Number of Elements">
        <Input
          key="number-of-elements"
          type="number"
          onChange={(value) => handleChangeElementMaxLength(parseInt(value))}
          value={`${elementMaxLength}`}
          sx={{
            width: "100%",
          }}
        />
      </RightFormBox>
      <SettingsRightPanelForm isChild />
    </Box>
  );
};
