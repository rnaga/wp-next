import { HTMLAttributes, useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Alert, Box, SxProps } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { ListBase } from "@rnaga/wp-next-ui/ListBase";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { $isWPElementOrTextNode, WPElementNode, WPTextNode } from "../";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { RESERVED_ATTRIBUTE_KEYS } from "../constants";

type FormMode = "add" | "edit" | null;

export const AttributesRightPanelForm = (props: {
  targetNode?: WPElementNode | WPTextNode;
  title?: string;
  sx?: SxProps;
  isChild?: boolean;
  hideAttributeKeys?: string[];
}) => {
  const { selectedNode } = useSelectedNode();
  const [targetNode, setTargetNode] = useState<
    WPElementNode | WPTextNode | undefined
  >(props.targetNode);

  const [editor] = useLexicalComposerContext();

  const [attributes, setAttributes] = useState<HTMLAttributes<any>>({});
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Unified form state - update via onChange
  const [formValues, setFormValues] = useState({ name: "", value: "" });

  const resetForm = () => {
    setFormMode(null);
    setEditingIndex(null);
    setErrorMessage("");
    setFormValues({ name: "", value: "" });
  };

  const handleSubmitForm = () => {
    const name = formValues.name.trim();
    const value = formValues.value;

    if (!targetNode || !$isWPElementOrTextNode(targetNode) || !name) {
      return;
    }

    if (formMode === "add") {
      // Check if the attribute key is reserved
      if (RESERVED_ATTRIBUTE_KEYS.includes(name)) {
        setErrorMessage(
          `Cannot add attribute "${name}". This is a reserved attribute key.`
        );
        return;
      }

      editor.update(
        () => {
          const writable = targetNode.getWritable();
          const currentAttributes = { ...writable.getAttributes() };
          (currentAttributes as Record<string, any>)[name] = value;
          writable.setAttributes(currentAttributes);

          // Sync parent collections if needed
          $syncParentCollections(writable);

          editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
            node: writable,
          });
        },
        {
          discrete: true,
        }
      );

      // Update local state
      setAttributes((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (formMode === "edit" && editingIndex !== null) {
      const attributeKeys = Object.keys(attributes);
      const oldAttributeName = attributeKeys[editingIndex];
      if (!oldAttributeName) return;

      editor.update(
        () => {
          const writable = targetNode.getWritable();
          const currentAttributes = { ...writable.getAttributes() };

          // If the name changed, delete the old attribute
          if (oldAttributeName !== name) {
            delete (currentAttributes as Record<string, any>)[oldAttributeName];
          }

          // Set the new/updated attribute
          (currentAttributes as Record<string, any>)[name] = value;
          writable.setAttributes(currentAttributes);

          editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
            node: writable,
          });
        },
        {
          discrete: true,
        }
      );

      // Update local state
      setAttributes((prev) => {
        const updated = { ...prev };
        if (oldAttributeName !== name) {
          delete (updated as Record<string, any>)[oldAttributeName];
        }
        (updated as Record<string, any>)[name] = value;
        return updated;
      });
    }

    resetForm();
  };

  const handleEditAttribute = (index: number) => {
    const attributeKeys = Object.keys(attributes);
    const attributeName = attributeKeys[index];
    if (!attributeName) return;

    const attributeValue = (attributes as Record<string, any>)[attributeName];

    // Set form values for rendering
    setFormValues({
      name: attributeName,
      value: String(attributeValue || ""),
    });

    setFormMode("edit");
    setEditingIndex(index);
  };

  const handleDeleteAttribute = (index: number) => {
    if (!targetNode || !$isWPElementOrTextNode(targetNode)) {
      return;
    }

    const attributeKeys = Object.keys(attributes);
    const attributeName = attributeKeys[index];
    if (!attributeName) return;

    editor.update(
      () => {
        const writable = targetNode.getWritable();
        const currentAttributes = { ...writable.getAttributes() };
        delete (currentAttributes as Record<string, any>)[attributeName];
        writable.setAttributes(currentAttributes);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );

    // Update local state
    setAttributes((prev) => {
      const updated = { ...prev };
      delete (updated as Record<string, any>)[attributeName];
      return updated;
    });

    resetForm();
  };

  useEffect(() => {
    if (!$isWPElementOrTextNode(targetNode)) {
      setAttributes({});
      resetForm();
      return;
    }

    setAttributes(targetNode.getAttributes());
  }, [targetNode]);

  // If targetNode prop is not provided, use selectedNode from global state
  // (this is the most common case)
  useEffect(() => {
    if (!targetNode && $isWPElementOrTextNode(selectedNode)) {
      setTargetNode(selectedNode);
    }
  }, [selectedNode]);

  if (!targetNode || !$isWPElementOrTextNode(targetNode)) return null;

  const attributeItems = Object.entries(attributes)
    .filter(([name]) => !props.hideAttributeKeys?.includes(name))
    .map(([name, value]) => ({
      value: name,
      label: `${name}: ${value}`,
    }));

  const isFormVisible = formMode !== null;

  return (
    <Box
      sx={{
        mx: props.isChild ? 0 : 2,
        mt: props.isChild ? 2 : 1,
        ...props.sx,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <RightPanelSectionTitle title={props.title || "Attributes"} />

        {attributeItems.length > 0 && (
          <ListBase
            items={attributeItems}
            size="small"
            displayType="vertical"
            onEdit={(index) => {
              handleEditAttribute(index);
            }}
            onDelete={(index) => {
              handleDeleteAttribute(index);
            }}
            getItemSx={() => ({
              py: 0.25,
            })}
            sx={{
              width: "100%",
              mb: 1,
            }}
          />
        )}

        {isFormVisible && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            {errorMessage && (
              <Alert
                severity="error"
                onClose={() => setErrorMessage("")}
                sx={{
                  fontSize: 10,
                }}
              >
                {errorMessage}
              </Alert>
            )}
            {formMode === "edit" && (
              <Typography fontSize={12} fontWeight={600}>
                Edit Attribute
              </Typography>
            )}
            <Box>
              <Typography fontSize={12} sx={{ mb: 0.5 }}>
                Name
              </Typography>
              <Input
                value={formValues.name}
                onChange={(value) =>
                  setFormValues((prev) => ({ ...prev, name: value || "" }))
                }
                size="small"
                placeholder="e.g., data-id"
                sx={{ width: "100%" }}
              />
            </Box>
            <Box>
              <Typography fontSize={12} sx={{ mb: 0.5 }}>
                Value
              </Typography>
              <Input
                value={formValues.value}
                onChange={(value) =>
                  setFormValues((prev) => ({ ...prev, value: value || "" }))
                }
                size="small"
                placeholder="e.g., 123"
                sx={{ width: "100%" }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" onClick={handleSubmitForm} sx={{ flex: 1 }}>
                <Typography size="small">
                  {formMode === "add" ? "Submit" : "Update"}
                </Typography>
              </Button>
              <Button
                size="small"
                onClick={resetForm}
                sx={{ flex: 1 }}
                color="error"
              >
                <Typography size="small">Cancel</Typography>
              </Button>
            </Box>
          </Box>
        )}

        {!isFormVisible && (
          <Button
            size="small"
            onClick={() => setFormMode("add")}
            sx={{ width: "100%" }}
          >
            <Typography size="small">Add Attribute</Typography>
          </Button>
        )}
      </Box>
    </Box>
  );
};
