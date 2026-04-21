import { useCallback, useEffect, useState } from "react";
import { COMMAND_PRIORITY_HIGH } from "lexical";
import { Box } from "@mui/material";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Textarea } from "@rnaga/wp-next-ui/Textarea";

import { useToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { useSelectedNode } from "../../../../client/global-event";
import { DataInputEndDecorator } from "../../../../client/forms/components/DataInputEndDecorator";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $isHeadingNode } from "../HeadingNode";
import { $loadTemplateText } from "../../template-text/TemplateTextNode";

export const HeadingToolBox = () => {
  const [editor] = useLexicalComposerContext();
  const { settings } = useToolBox();
  const { selectedNode } = useSelectedNode();
  const [openModal, setOpenModal] = useState(false);
  const [template, setTemplate] = useState("");

  const getLatestTemplate = useCallback(
    () =>
      editor.read(() => {
        const latestNode = selectedNode?.getLatest();
        return $isHeadingNode(latestNode) ? latestNode.__template : "";
      }),
    [editor, selectedNode]
  );

  useEffect(() => {
    if (!selectedNode || selectedNode.getType() !== "heading") {
      settings.disable();
      return;
    }

    settings.enable();
  }, [selectedNode]);

  useEffect(() => {
    if (settings.isOpen) {
      setOpenModal(true);
    }
  }, [selectedNode, settings.isOpen]);

  useEffect(() => {
    const latestTemplate = getLatestTemplate();
    setTemplate(latestTemplate);
  }, [getLatestTemplate]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (node.getKey() !== selectedNode?.getKey()) {
          return false;
        }

        const latestTemplate = getLatestTemplate();
        setTemplate((prev) =>
          prev === latestTemplate ? prev : latestTemplate
        );
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, getLatestTemplate, selectedNode]);

  const handleCloseModal = () => {
    setOpenModal(false);
    settings.close();
  };

  const handleTemplateChange = (value: string) => {
    if (!$isHeadingNode(selectedNode)) return;

    setTemplate(value);

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.setTemplate(value);
        $loadTemplateText(writable);
      },
      {
        discrete: true,
      }
    );

    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: selectedNode,
    });
  };

  if (!selectedNode || selectedNode.getType() !== "heading") return null;

  return (
    <DraggableBox
      open={openModal}
      onClose={handleCloseModal}
      title="Heading Editor"
      size="medium"
      resizable={true}
      sx={{
        minWidth: 340,
        maxWidth: "50vw",
        minHeight: 240,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            position: "relative",
            flex: 1,
            display: "flex",
          }}
        >
          <Textarea
            value={template}
            onChange={handleTemplateChange}
            placeholder="Enter heading text"
            minRows={10}
            style={{
              flex: 1,
              fontSize: 12,
              padding: "8px 36px 8px 8px",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 10,
              bottom: 12,
            }}
          >
            <DataInputEndDecorator
              onClick={(dataValue) => {
                const dataVariable = `\${${dataValue}}`;
                const newTemplate = template + dataVariable;
                handleTemplateChange(newTemplate);
              }}
            />
          </Box>
        </Box>
      </Box>
    </DraggableBox>
  );
};
