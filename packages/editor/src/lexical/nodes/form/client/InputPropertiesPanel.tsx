import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";

import {
  FormFlexBox,
  FormStyleControl,
} from "../../../../client/forms/components";

import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { InputNode } from "../InputNode";
import {
  $getFormInputName,
  $getFormLabel,
  $isFormRelatedNode,
  $updateFormInputName,
  $updateFormLabel,
  $updateInputAttribute,
  INPUT_TYPES,
  INPUT_TEXT_TYPE,
  InputAttributes,
  InputType,
  getInputAttributes,
} from "../input";
import { $isInputWrapperNode, InputWrapperNode } from "../InputWrapperNode";
import { $walkNode } from "../../..";
import { FORM_INPUT_PROPERTY_UPDATED } from "../commands";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { FieldSetNode } from "../FieldSetNode";
import { FormNode } from "../FormNode";
import { $syncParentCollections } from "../../collection/CollectionNode";

export const InputPropertiesPanel = (props: {
  // Option 1: Pass formNode and index to find the input
  inputIndex?: number;
  formNodeOrFieldSetNode?: FormNode | FieldSetNode;
  // Option 2: Pass the inputWrapperNode directly
  inputWrapperNode?: InputWrapperNode;
  onClose?: () => void;
  // Whether to show the input type (read-only)
  showInputType?: boolean;
  // Whether to show the panel header with close button
  showHeader?: boolean;
}) => {
  const {
    inputIndex,
    formNodeOrFieldSetNode,
    onClose,
    showInputType = false,
    showHeader = true,
  } = props;
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  const [inputWrapperNode, setInputWrapperNode] = useState<
    InputWrapperNode | undefined
  >();
  const [formName, setFormName] = useState<string>();
  const [inputType, setInputType] = useState<InputType>("text");
  const [label, setLabel] = useState<string>("");
  const [attributes, setAttributes] = useState<InputAttributes>({});

  useEffect(() => {
    let targetWrapper: InputWrapperNode | undefined;

    // If inputWrapperNode is passed directly, use it
    if (props.inputWrapperNode) {
      targetWrapper = props.inputWrapperNode;
    }
    // Otherwise, find it from formNode and index
    else if (formNodeOrFieldSetNode !== undefined && inputIndex !== undefined) {
      const inputWrappers: InputWrapperNode[] = [];
      editor.read(() => {
        $walkNode(formNodeOrFieldSetNode, (node) => {
          if ($isInputWrapperNode(node)) {
            inputWrappers.push(node);
          }
        });
      });

      targetWrapper = inputWrappers[inputIndex];
    }

    if (!targetWrapper) {
      return;
    }

    setInputWrapperNode(targetWrapper);

    // Load properties from the wrapper
    editor.read(() => {
      const type = targetWrapper.getInputType();
      setInputType(type);

      const name = $getFormInputName(targetWrapper);
      setFormName(name);

      const lbl = $getFormLabel(targetWrapper) || "";
      setLabel(lbl);

      const attrs = getInputAttributes(targetWrapper);

      setAttributes(attrs || {});
    });
  }, [inputIndex, formNodeOrFieldSetNode, props.inputWrapperNode]);

  // Listen for property updates to refresh the local state
  useEffect(() => {
    return wpHooks.action.addCommand(FORM_INPUT_PROPERTY_UPDATED, (payload) => {
      // Only update if the changed node matches our current inputWrapperNode
      if (
        inputWrapperNode &&
        payload.node.getKey() === inputWrapperNode.getKey()
      ) {
        editor.read(() => {
          const name = $getFormInputName(inputWrapperNode);
          setFormName(name);

          const lbl = $getFormLabel(inputWrapperNode) || "";
          setLabel(lbl);

          const attrs = getInputAttributes(inputWrapperNode);
          setAttributes(attrs || {});
        });
      }
    });
  }, [inputWrapperNode]);

  const handleFormNameChange = (formName?: string) => {
    if (!inputWrapperNode) return;

    editor.update(
      () => {
        $updateFormInputName(inputWrapperNode.getLatest(), formName || "");

        wpHooks.action.doCommand(FORM_INPUT_PROPERTY_UPDATED, {
          node: inputWrapperNode.getLatest(),
        });
      },
      {
        discrete: true,
      }
    );

    setFormName(formName);
  };

  const handleLabelChange = (newLabel?: string) => {
    if (!inputWrapperNode) return;

    editor.update(
      () => {
        $updateFormLabel(inputWrapperNode.getLatest(), newLabel || "");

        wpHooks.action.doCommand(FORM_INPUT_PROPERTY_UPDATED, {
          node: inputWrapperNode.getLatest(),
        });
      },
      {
        discrete: true,
      }
    );

    setLabel(newLabel || "");
  };

  const handleAttributeChange =
    (key: keyof InputAttributes) => (newValue?: string) => {
      if (!inputWrapperNode) return;

      editor.update(
        () => {
          $updateInputAttribute(
            inputWrapperNode.getLatest(),
            key,
            newValue || ""
          );

          wpHooks.action.doCommand(FORM_INPUT_PROPERTY_UPDATED, {
            node: inputWrapperNode.getLatest(),
          });
        },
        {
          discrete: true,
        }
      );

      setAttributes((prev) => ({
        ...prev,
        [key]: newValue,
      }));
    };

  // Helper functions to determine visibility
  const shouldShowLabel = () => {
    const typesWithoutLabel: InputType[] = [
      "submit",
      "reset",
      "button",
      "hidden",
      "image",
    ];
    return !typesWithoutLabel.includes(inputType);
  };

  const shouldShowValue = () => {
    const buttonTypes: InputType[] = ["submit", "reset", "button"];
    return buttonTypes.includes(inputType);
  };

  const shouldShowPlaceholder = () => {
    return INPUT_TEXT_TYPE.includes(inputType as any);
  };

  if (!inputWrapperNode) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: showHeader ? 1 : 0,
        p: showHeader ? 1 : 0,
        border: showHeader ? "1px solid" : "none",
        borderColor: "divider",
        borderRadius: showHeader ? 1 : 0,
        backgroundColor: showHeader ? "background.paper" : "transparent",
      }}
    >
      {showHeader && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography fontSize={14} fontWeight={600}>
            Input Fields
          </Typography>
          {onClose && (
            <Typography
              fontSize={12}
              sx={{ cursor: "pointer", color: "primary.main" }}
              onClick={onClose}
            >
              Close
            </Typography>
          )}
        </Box>
      )}

      {showInputType && (
        <FormFlexBox>
          <FormStyleControl title="Input Type" width="100%">
            <Input key="input-type" type="text" value={inputType} disabled />
          </FormStyleControl>
        </FormFlexBox>
      )}

      <FormFlexBox>
        <FormStyleControl title="Name" width="100%">
          <Input
            key="form-name"
            type="text"
            onChange={handleFormNameChange}
            value={formName}
          />
        </FormStyleControl>
      </FormFlexBox>

      {shouldShowLabel() && (
        <FormFlexBox>
          <FormStyleControl title="Label" width="100%">
            <Input
              key="input-label"
              type="text"
              onChange={handleLabelChange}
              value={label}
            />
          </FormStyleControl>
        </FormFlexBox>
      )}

      <FormFlexBox>
        <FormStyleControl title="Value" width="100%">
          <Input
            key="input-value"
            type="text"
            onChange={handleAttributeChange("value")}
            value={attributes.value || " "}
          />
        </FormStyleControl>
      </FormFlexBox>

      {shouldShowPlaceholder() && (
        <FormFlexBox>
          <FormStyleControl title="Placeholder" width="100%">
            <Input
              key="input-placeholder"
              type="text"
              onChange={handleAttributeChange("placeholder")}
              value={attributes.placeholder || " "}
            />
          </FormStyleControl>
        </FormFlexBox>
      )}
    </Box>
  );
};
