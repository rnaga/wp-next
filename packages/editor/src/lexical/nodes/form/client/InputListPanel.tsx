import { useState, useEffect } from "react";

import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { ListBase } from "@rnaga/wp-next-ui/ListBase";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { $walkNode } from "../../..";
import { InputType } from "../input";
import { $isFormNode, FormNode } from "../FormNode";
import { $isFieldSetNode, FieldSetNode } from "../FieldSetNode";
import { InputPropertiesPanel } from "./InputPropertiesPanel";
import { FORM_INPUT_PROPERTY_UPDATED } from "../commands";
import { $isInputNode } from "../InputNode";

interface InputListPanelProps {
  formNodeOrFieldSetNode: FormNode | FieldSetNode;
}

export const InputListPanel = ({
  formNodeOrFieldSetNode,
}: InputListPanelProps) => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const [inputs, setInputs] = useState<
    {
      type: InputType;
      formName: string;
    }[]
  >([]);
  const [selectedInputIndex, setSelectedInputIndex] = useState<number | null>(
    null
  );

  const updateInputsList = () => {
    if (
      !$isFormNode(formNodeOrFieldSetNode) &&
      !$isFieldSetNode(formNodeOrFieldSetNode)
    ) {
      return;
    }

    const newInputs: { type: InputType; formName: string }[] = [];
    editor.read(() => {
      $walkNode(formNodeOrFieldSetNode, (node) => {
        if ($isInputNode(node)) {
          newInputs.push({
            type: node.getInputType(),
            formName: node.getFormName(),
          });
        }
      });
    });

    setInputs(newInputs);
  };

  useEffect(() => {
    updateInputsList();
  }, [formNodeOrFieldSetNode]);

  // Listen for form input property updates to refresh the inputs list
  useEffect(() => {
    return wpHooks.action.addCommand(FORM_INPUT_PROPERTY_UPDATED, () => {
      // Refresh the inputs list when any form input property changes
      if (
        $isFormNode(formNodeOrFieldSetNode) ||
        $isFieldSetNode(formNodeOrFieldSetNode)
      ) {
        updateInputsList();
      }
    });
  }, [formNodeOrFieldSetNode, wpHooks]);

  const handleEditInput = (index: number) => {
    setSelectedInputIndex(index);
  };

  const handleCloseInputProperties = () => {
    setSelectedInputIndex(null);
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Typography fontSize={14} fontWeight={600}>
          Fields
        </Typography>
        <ListBase
          items={inputs.map((input) => ({
            value: input.formName,
            label: `${input.formName} (${input.type})`,
          }))}
          size="small"
          displayType="vertical"
          editable
          onClick={(item, e) => {
            e.stopPropagation();
            handleEditInput(item.index);
          }}
          getItemSx={(item) => ({
            cursor: "pointer",
            py: 0.25,
            backgroundColor:
              selectedInputIndex === item.index
                ? "action.selected"
                : "transparent",
          })}
          sx={{
            width: "100%",
          }}
        />
      </Box>

      {selectedInputIndex !== null &&
        ($isFormNode(formNodeOrFieldSetNode) ||
          $isFieldSetNode(formNodeOrFieldSetNode)) && (
          <Box
            sx={{
              width: "100%",
            }}
          >
            <InputPropertiesPanel
              inputIndex={selectedInputIndex}
              formNodeOrFieldSetNode={formNodeOrFieldSetNode}
              onClose={handleCloseInputProperties}
              showInputType={true}
              showHeader={true}
            />
          </Box>
        )}
    </>
  );
};
