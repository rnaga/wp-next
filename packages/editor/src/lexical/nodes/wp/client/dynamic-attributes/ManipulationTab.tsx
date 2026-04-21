import { useState } from "react";

import {
  Box,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { ListBase } from "@rnaga/wp-next-ui/ListBase";

import { useDynamicAttributes } from "./DynamicAttributesContext";

type AttributeFormMode = "add" | "edit" | null;

export const ManipulationTab = () => {
  const { draftRule, updateSettings } = useDynamicAttributes();
  const { settings } = draftRule;

  // Attribute form state
  const [formMode, setFormMode] = useState<AttributeFormMode>(null);
  const [editingAttrIndex, setEditingAttrIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState({ name: "", value: "" });

  const handleDisplayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ display: event.target.checked });
  };

  const handleClassnamesChange = (value: string[]) => {
    updateSettings({
      externalClassnames: value.length > 0 ? value : undefined,
    });
  };

  const resetAttributeForm = () => {
    setFormMode(null);
    setEditingAttrIndex(null);
    setFormValues({ name: "", value: "" });
  };

  const handleAddAttribute = () => {
    setFormMode("add");
    setFormValues({ name: "", value: "" });
  };

  const handleEditAttribute = (index: number) => {
    const attributeKeys = Object.keys(settings.customAttributes || {});
    const attrName = attributeKeys[index];
    if (!attrName) return;

    const attrValue = (settings.customAttributes as Record<string, any>)[
      attrName
    ];
    setFormMode("edit");
    setEditingAttrIndex(index);
    setFormValues({
      name: attrName,
      value: String(attrValue ?? ""),
    });
  };

  const handleDeleteAttribute = (index: number) => {
    const attributeKeys = Object.keys(settings.customAttributes || {});
    const attrName = attributeKeys[index];
    if (!attrName) return;

    const newAttributes = { ...settings.customAttributes };
    delete (newAttributes as Record<string, any>)[attrName];
    updateSettings({ customAttributes: newAttributes });
    resetAttributeForm();
  };

  const handleSubmitAttribute = () => {
    const name = formValues.name.trim();
    const value = formValues.value;

    if (!name) return;

    const newAttributes = { ...settings.customAttributes };

    if (formMode === "edit" && editingAttrIndex !== null) {
      const attributeKeys = Object.keys(settings.customAttributes || {});
      const oldName = attributeKeys[editingAttrIndex];
      if (oldName && oldName !== name) {
        delete (newAttributes as Record<string, any>)[oldName];
      }
    }

    (newAttributes as Record<string, any>)[name] = value;
    updateSettings({ customAttributes: newAttributes });
    resetAttributeForm();
  };

  const attributeItems = Object.entries(settings.customAttributes || {}).map(
    ([name, value]) => ({
      value: name,
      label: `${name}: ${value}`,
    })
  );

  const isFormVisible = formMode !== null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Display Toggle */}
      <Box>
        <Typography size="small" sx={{ fontWeight: 600, mb: 1 }}>
          Visibility
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={settings.display}
              onChange={handleDisplayChange}
              size="small"
            />
          }
          label={
            <Typography size="small">
              {settings.display ? "Visible" : "Hidden"}
            </Typography>
          }
        />
        <Typography size="small" sx={{ color: "text.secondary", mt: 0.5 }}>
          When conditions are met, the element will be{" "}
          {settings.display ? "visible" : "hidden"}.
        </Typography>
      </Box>

      {/* External Classnames */}
      <Box>
        <Typography size="small" sx={{ fontWeight: 600, mb: 1 }}>
          Additional CSS Classes
        </Typography>
        <InputMultiple
          value={settings.externalClassnames ?? []}
          onChange={handleClassnamesChange}
        />
        <Typography size="small" sx={{ color: "text.secondary", mt: 0.5 }}>
          CSS classes to add when conditions are met (e.g., bg-red-500).
        </Typography>
      </Box>

      {/* Custom Attributes */}
      <Box>
        <Typography size="small" sx={{ fontWeight: 600, mb: 1 }}>
          Custom Attributes
        </Typography>

        {attributeItems.length > 0 && (
          <ListBase
            items={attributeItems}
            size="small"
            displayType="vertical"
            onEdit={(index) => handleEditAttribute(index)}
            onDelete={(index) => handleDeleteAttribute(index)}
            getItemSx={() => ({ py: 0.25 })}
            sx={{ width: "100%", mb: 1 }}
          />
        )}

        {isFormVisible && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 1.5,
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 1,
              backgroundColor: "grey.50",
              mb: 1,
            }}
          >
            <Typography size="small" sx={{ fontWeight: 500 }}>
              {formMode === "add" ? "Add Attribute" : "Edit Attribute"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography size="small" sx={{ mb: 0.5 }}>
                  Name
                </Typography>
                <Input
                  size="small"
                  value={formValues.name}
                  onChange={(value) =>
                    setFormValues((prev) => ({ ...prev, name: value ?? "" }))
                  }
                  placeholder="e.g., data-id"
                  sx={{ width: "100%" }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography size="small" sx={{ mb: 0.5 }}>
                  Value
                </Typography>
                <Input
                  size="small"
                  value={formValues.value}
                  onChange={(value) =>
                    setFormValues((prev) => ({ ...prev, value: value ?? "" }))
                  }
                  placeholder="e.g., 123"
                  sx={{ width: "100%" }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Tooltip title="Save">
                <IconButton
                  size="small"
                  onClick={handleSubmitAttribute}
                  sx={{ color: "success.main" }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  onClick={resetAttributeForm}
                  sx={{ color: "error.main" }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}

        {!isFormVisible && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddAttribute}
            sx={{ alignSelf: "flex-start" }}
          >
            Add Attribute
          </Button>
        )}

        <Typography size="small" sx={{ color: "text.secondary", mt: 1 }}>
          HTML attributes to add when conditions are met.
        </Typography>
      </Box>
    </Box>
  );
};
