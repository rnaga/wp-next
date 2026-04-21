import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";

import {
  FormFlexBox,
  FormStyleControl,
} from "../../../../client/forms/components";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";

import { Select } from "@rnaga/wp-next-ui/Select";
import { $buildInputElements, INPUT_TYPES, InputType } from "../input";
import { $isInputWrapperNode, InputWrapperNode } from "../InputWrapperNode";
import { InputPropertiesPanel } from "./InputPropertiesPanel";
import { $isInputNode } from "../InputNode";
import { AttributesRightPanelForm } from "../../wp/client/AttributesRightPanelForm";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { $isLabelNode, LabelNode } from "../LabelNode";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";

export const InputWrapperRightPanelForm = (props: {
  children?: React.ReactNode;
}) => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const [inputType, setInputType] = useState<InputType>("text");
  const [inputNode, setInputNode] = useState<InputWrapperNode | undefined>();
  const [labelNode, setLabelNode] = useState<LabelNode | undefined>();

  const handleInputTypeChange = (type: string | null) => {
    if (!selectedNode || !$isInputWrapperNode(selectedNode)) return;

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        $buildInputElements(writable, type as InputType);

        setInputType(type as InputType);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  useEffect(() => {
    if (!$isInputWrapperNode(selectedNode)) {
      return;
    }

    // Get InputNode from InputWrapperNode
    const inputNode = editor.read(() =>
      selectedNode.getChildren().find($isInputNode)
    );
    setInputNode(inputNode as InputWrapperNode);

    const labelNode = editor.read(() =>
      selectedNode.getChildren().find($isLabelNode)
    );
    setLabelNode(labelNode as LabelNode);

    const inputType = editor.read(() =>
      selectedNode.getLatest().getInputType()
    );

    setInputType(inputType);
  }, [selectedNode]);

  if (!selectedNode || !$isInputWrapperNode(selectedNode)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
      }}
    >
      <Box>
        <RightPanelSectionTitle title="Input Field Settings" />

        <FormFlexBox>
          <FormStyleControl title="Input Type" width="100%">
            <Select
              key="input-type"
              onChange={handleInputTypeChange}
              enum={INPUT_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
              value={inputType}
            />
          </FormStyleControl>
        </FormFlexBox>

        <InputPropertiesPanel
          inputWrapperNode={selectedNode}
          showHeader={false}
          showInputType={false}
        />
      </Box>

      <AttributesRightPanelForm isChild />

      {inputNode && (
        <AttributesRightPanelForm
          targetNode={inputNode}
          title="Attributes (For Input Element)"
          isChild
        />
      )}

      {labelNode && (
        <AttributesRightPanelForm
          targetNode={labelNode}
          title="Attributes (For Label Element)"
          isChild
        />
      )}

      {props.children}
    </Box>
  );
};
