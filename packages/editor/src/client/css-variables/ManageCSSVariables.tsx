import { useEffect, useState, useTransition } from "react";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, FormControl } from "@mui/material";

import { FormLabelText } from "../forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Button } from "@rnaga/wp-next-ui/Button";
import { LengthInput } from "../forms/components/LengthInput";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectCustomFont } from "../forms/components/SelectCustomFont";
import { SelectGoogleFont } from "../forms/components/SelectGoogleFont";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useCSSVariables } from "./CSSVariablesContext";

import type * as types from "../../types";
import { content } from "@rnaga/wp-node/defaults/seeder";
import { useSelectedNode } from "../global-event";
import { NODE_PROPERTY_UPDATED } from "../node-event";
const defaultContentItem: types.CSSVariablesContentItem = {
  variableName: "",
  syntax: "universal",
  inherit: true,
  initialValue: "",
} as types.CSSVariablesContentItem;

const ManageFont = (props: {
  contentItem?: types.CSSVariablesContentItem;
  onChange: (args: {
    $type: types.FontType;
    $slug: string;
    fontFamily: string;
    fontStyle?: string;
    fontWeight?: number;
  }) => void;
  size?: "small" | "medium";
}) => {
  const { contentItem, onChange, size } = props;
  const [fontType, setFontType] = useState<types.FontType>(
    contentItem?.font?.$type ?? "raw"
  );
  const [font, setFont] = useState<types.CSSVariablesContentItem["font"]>(
    contentItem?.font
  );

  const handleChange = (args: {
    $type?: string;
    $slug?: string;
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: number;
  }) => {
    setFont({
      $type: fontType,
      $slug: args.$slug,
      fontFamily: args.fontFamily,
      fontStyle:
        (args.fontStyle ?? fontType === "google") ? "normal" : undefined,
      fontWeight: (args.fontWeight ?? fontType === "google") ? 400 : undefined,
    } as types.CSSVariablesContentItem["font"]);
  };

  useEffect(() => {
    // Trigger onChange if fontFamily has values of
    // fontType, fontFamily
    // if custom font, then it requires slug
    // if google font, then it requires fontStyle and fontWeight
    if (!font?.fontFamily || !font.$type) return;

    // Check requirements before calling onChange
    if (
      (font.$type === "custom" && !font.$slug) ||
      (font.$type === "google" && (!font.fontStyle || !font.fontWeight))
    ) {
      logger.warn("Font data is incomplete for the selected type.");
      return;
    }

    onChange({
      $type: font.$type,
      $slug: font.$slug ?? "",
      fontFamily: font.fontFamily,
      fontStyle: font.fontStyle,
      fontWeight: font.fontWeight,
    });
  }, [font]);

  return (
    <>
      <FormControl fullWidth>
        <FormLabelText label="Font Type" size={size} />
        <Select
          size={size}
          enum={[
            { label: "Google Fonts", value: "google" },
            { label: "Custom Fonts", value: "custom" },
            { label: "Enter Manually", value: "raw" },
          ]}
          value={font?.$type ?? "raw"}
          onChange={(value) => {
            setFontType((value ?? "raw") as types.FontType);
          }}
        />
      </FormControl>
      {fontType === "google" && (
        <>
          <FormControl fullWidth>
            <FormLabelText label="Google Font" size={size} />
            <SelectGoogleFont
              size={size}
              onChange={(value) => {
                handleChange({
                  fontFamily: value,
                });
              }}
              value={font?.fontFamily}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabelText label="Font Style" size={size} />
            <Select
              size={size}
              enum={[
                { label: "Italic", value: "italic" },
                { label: "Normal", value: "normal" },
              ]}
              value={"normal"}
              onChange={(value) => {
                handleChange({
                  fontStyle: value ?? "normal",
                });
                // handleUpdate("fontStyle", value);
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabelText label="Font Weight" size={size} />
            <Select
              size={size}
              enum={[
                { label: "100", value: 100 },
                { label: "200", value: 200 },
                { label: "300", value: 300 },
                { label: "400", value: 400 },
                { label: "500", value: 500 },
                { label: "600", value: 600 },
                { label: "700", value: 700 },
                { label: "800", value: 800 },
                { label: "900", value: 900 },
              ]}
              value={400}
              onChange={(value) => {
                handleChange({
                  fontWeight: parseInt(value ?? "400"),
                });
                // handleUpdate("fontWeight", value);
              }}
            />
          </FormControl>
        </>
      )}
      {fontType === "custom" && (
        <FormControl fullWidth>
          <FormLabelText label="Custom Font" size={size} />
          <SelectCustomFont
            size={size}
            value={font?.$slug}
            onChange={(fontFamily, $slug) => {
              handleChange({
                fontFamily,
                $slug,
              });
            }}
          />
        </FormControl>
      )}
      {fontType === "raw" && (
        <FormControl fullWidth>
          <Input
            size={size}
            value={contentItem?.font?.fontFamily ?? ""}
            onChange={(value) => {
              handleChange({
                fontFamily: value,
              });
            }}
            placeholder="Enter font name"
          />
        </FormControl>
      )}
    </>
  );
};

export const ManageCSSVariables = (props: {
  open: boolean;
  onClose: () => void;
  variableIndex?: number; // Passed when editing an existing variable
  cssVariables: types.CSSVariables;
}) => {
  const { open, onClose } = props;

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 400,
          }}
        >
          <EditCSSVariable
            size="medium"
            ID={props.cssVariables.ID}
            variableIndex={props.variableIndex}
            onSubmit={onClose}
            onCancel={onClose}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
};

export const EditCSSVariable = (props: {
  ID: number; // ID of the CSS Variables
  variableIndex?: number; // Passed when editing an existing variable
  onSubmit?: VoidFunction;
  onUpdate?: (item: types.CSSVariablesContentItem) => void;
  onCancel?: VoidFunction;
  size?: "small" | "medium";
}) => {
  const { variableIndex, onSubmit, onUpdate, size, onCancel } = props;

  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [submitting, startSubmitting] = useTransition();
  const [canceling, startCanceling] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [contentItem, setContentItem] =
    useState<types.CSSVariablesContentItem>(defaultContentItem);
  const { softUpdateItem, updateItem, undoSoftUpdate, cssVariablesList } =
    useCSSVariables();

  // Find the CSS Variables by ID
  const cssVariables = cssVariablesList.find(
    (cssVariable) => cssVariable.ID === props.ID
  );

  const isEditing = variableIndex !== undefined;

  useEffect(() => {
    if (typeof variableIndex !== "number" || isNaN(variableIndex)) {
      setContentItem(defaultContentItem);
      setErrorMessage(undefined);
      return;
    }

    const newContentItem = cssVariables?.content?.[variableIndex];

    if (!newContentItem) {
      return;
    }

    setContentItem(newContentItem);

    return () => {
      // Cleanup function to reset the content item when the modal is closed
      setContentItem(defaultContentItem);
      setErrorMessage(undefined);
    };
  }, [cssVariables, variableIndex]);

  const handleUpdate = (
    key: keyof types.CSSVariablesContentItem,
    value: string | number | undefined
  ) => {
    const newItem: types.CSSVariablesContentItem = {
      ...contentItem,
      [key]: value,
    };

    setContentItem(newItem);
    onUpdate?.(newItem);
    setErrorMessage(undefined);

    if (isEditing) {
      // Perform a soft update when editing an existing variable to enable real-time preview.
      softUpdateItem(cssVariables!, variableIndex, newItem);
    }
  };

  const handleSubmit = () => {
    startSubmitting(async () => {
      const [success, newContent] = await updateItem(
        cssVariables!,
        variableIndex,
        contentItem
      );

      editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
        type: "input",
        node: selectedNode!,
      });

      setContentItem(defaultContentItem);
      onSubmit?.();
    });
  };

  const handleCancel = async () => {
    startCanceling(async () => {
      await undoSoftUpdate();
      onCancel?.();
    });
  };

  const handleFontChange = (args: {
    $type: types.FontType;
    $slug: string;
    fontFamily: string;
    fontStyle?: string;
    fontWeight?: number;
  }) => {
    setContentItem({
      ...contentItem,
      initialValue: args.fontFamily,
      font: { ...args },
    } as types.CSSVariablesContentItem);
  };

  // This never happens
  if (!cssVariables) {
    return null;
  }

  const isInitialValueArray = contentItem.initialValueDataType === "array";
  const initialValue = isInitialValueArray
    ? contentItem.initialValueString
    : (contentItem.initialValue as string | number);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
        onClick={() => {
          setErrorMessage(undefined);
        }}
      >
        <FormControl fullWidth>
          <FormLabelText label="Name" size={size} />
          <Input
            size={size}
            value={contentItem.variableName ?? ""}
            onChange={(value) => {
              handleUpdate("variableName", value);
            }}
            readOnly={isEditing}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Syntax" size={size} />
          <Select
            size={size}
            enum={[
              { label: "Angle", value: "angle" },
              { label: "Color", value: "color" },
              { label: "Number", value: "number" },
              { label: "Length", value: "length" },
              { label: "String", value: "string" },
              { label: "Font", value: "font" },
              { label: "Universal", value: "universal" },
            ]}
            value={contentItem.syntax ?? "universal"}
            onChange={(value) => {
              handleUpdate("syntax", value as types.CSSVariableContentSyntax);
            }}
            readOnly={isEditing}
          />
        </FormControl>
        {contentItem.syntax === "universal" && (
          <FormControl fullWidth>
            <FormLabelText
              label="Value (string must be quoted (&quot;&quot; or ''))."
              size={size}
            />

            <Input
              size={size}
              readOnly={isInitialValueArray}
              value={initialValue ?? " "}
              onChange={(value) => {
                handleUpdate("initialValue", value);
              }}
            />
          </FormControl>
        )}
        {["string", "number"].includes(contentItem.syntax) && (
          <FormControl fullWidth>
            <FormLabelText label="Value" size={size} />
            <Input
              size={size}
              readOnly={contentItem.initialValueDataType === "array"}
              type={"number" === contentItem.syntax ? "number" : "text"}
              value={initialValue ?? ""}
              onChange={(value) => {
                handleUpdate("initialValue", value);
              }}
            />
          </FormControl>
        )}
        {contentItem.syntax === "length" && (
          <Box>
            <FormLabelText label="Value" size={size} />
            <LengthInput
              size={size}
              readOnly={isInitialValueArray}
              onChange={(value) => {
                handleUpdate("initialValue", value);
              }}
              value={initialValue}
            />
          </Box>
        )}
        {contentItem.syntax === "angle" && (
          <Box>
            <FormLabelText label="Value" size={size} />
            <LengthInput
              size={size}
              readOnly={isInitialValueArray}
              onChange={(value) => {
                handleUpdate("initialValue", value);
              }}
              value={initialValue}
              includeUnits={["deg"]}
              min={-360}
              max={360}
            />
          </Box>
        )}
        {contentItem.syntax === "color" && (
          <Box>
            <FormLabelText label="Value" size={size} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                alignItems: "center",
                maxHeight: 50,
              }}
            >
              <Input
                size={size}
                readOnly={isInitialValueArray}
                value={initialValue ?? "#000000"}
                onChange={(value) => {
                  handleUpdate("initialValue", value);
                }}
              />

              <input
                type="color"
                style={{
                  width: 30,
                }}
                readOnly={isInitialValueArray}
                value={initialValue ?? "#000000"}
                onChange={(e) => {
                  const value = e.target.value;
                  handleUpdate("initialValue", value);
                }}
              />
            </Box>
          </Box>
        )}
        {contentItem.syntax === "font" && (
          <ManageFont
            size={size}
            contentItem={contentItem}
            onChange={handleFontChange}
          />
        )}
      </Box>
      {errorMessage && (
        <Typography color="error" size={size}>
          {errorMessage}
        </Typography>
      )}
      {contentItem.initialValueDataType !== "array" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            mt: 1,
          }}
        >
          <Button
            loading={submitting}
            size={size}
            onClick={() => {
              handleSubmit();
            }}
          >
            Submit
          </Button>
          <Button
            loading={canceling}
            size={size}
            color="error"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Box>
      )}
    </>
  );
};
