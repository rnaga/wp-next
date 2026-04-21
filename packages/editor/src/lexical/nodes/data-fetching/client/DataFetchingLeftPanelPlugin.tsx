import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_HIGH,
  ElementNode,
} from "lexical";
import { JSX, useEffect, useState, Fragment, useCallback } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import AddIcon from "@mui/icons-material/Add";

import { $isDataFetchingNode, DataFetchingNode } from "../DataFetchingNode";
import { DataFetchingFormModal } from "./DataFetchingForm";

import {
  DATA_FETCHING_NODE_CREATED_COMMAND,
  DATA_FETCHING_NODE_DESTROYED_COMMAND,
} from "../commands";
import { List, ListItem } from "../../../../client/forms/components/List";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Box, IconButton } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";

export const DataFetchingLeftPanelPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [items, setItems] = useState<(JSX.Element | null)[]>([]);

  const [openSettings, setOpenSettings] = useState({
    open: false,
    node: undefined as DataFetchingNode | undefined,
  });

  const handleEdit = (node: DataFetchingNode) => {
    setOpenSettings({
      open: true,
      node: node as DataFetchingNode,
    });
  };

  // const handleDelete = (node: DataFetchingNode) => {
  //   editor.update(
  //     () => {
  //       node.remove();
  //     },
  //     {
  //       discrete: true,
  //     }
  //   );
  // };

  const itemsFn = useCallback((node: ElementNode): (JSX.Element | null)[] => {
    return node.getChildren().map((node) => {
      // Return null if not an element node or no children,
      if (
        ($isElementNode(node) && node.getChildren().length === 0) ||
        !$isDataFetchingNode(node) ||
        // Filter out nodes that should be hidden from left panel
        node.__hidden === true
      ) {
        return null;
      }

      if ($isElementNode(node) && node.getChildren().length > 0) {
        return <Fragment key={node.getName()}>{itemsFn(node)}</Fragment>;
      }

      return (
        <ListItem
          key={node.getName()}
          onClick={() => handleEdit(node as DataFetchingNode)}
          // sx={{
          //   cursor: "pointer",
          //   width: "100%",
          //   justifyContent: "flex-start",
          //   pl: 1,
          //   m: 0,
          //   "&:hover": {
          //     backgroundColor: (theme) => theme.palette.grey[300],
          //   },
          // }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              color: "black",
            }}
          >
            {node.getName()} (key: {node.getKey()})
          </Typography>
        </ListItem>
      );
    });
  }, []);

  // Initial load - Get and set all data nodes
  useEffect(() => {
    editor.read(() => {
      const items = itemsFn($getRoot());
      setItems(items);
    });
  }, []);

  // Update items on node creation, destruction
  useEffect(() => {
    const removeCommands: ReturnType<typeof editor.registerCommand>[] = [];
    for (const command of [
      DATA_FETCHING_NODE_CREATED_COMMAND,
      DATA_FETCHING_NODE_DESTROYED_COMMAND,
    ]) {
      removeCommands.push(
        editor.registerCommand(
          command,
          (args) => {
            const rootNode = $getRoot();
            setItems(itemsFn(rootNode));
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    }

    return () => {
      for (const removeCommand of removeCommands) {
        removeCommand();
      }
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={() => {
            setOpenSettings({
              open: true,
              node: undefined,
            });
          }}
          sx={{
            m: 2,
            width: "100%",
          }}
        >
          Create
        </Button>
      </Box>
      <DataFetchingFormModal
        open={openSettings.open}
        selectedDataFetchingNode={openSettings.node}
        onClose={() =>
          setOpenSettings({
            open: false,
            node: undefined,
          })
        }
      />
      <List>{items}</List>
    </>
  );
};
