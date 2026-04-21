import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { HelpTooltip } from "../../../forms/components/HelpTooltip";
import { getConfigurableNodeItems } from "../../../../lexical/template-config";
import * as vals from "../../../../validators";
import { useSelectedNode } from "../../../global-event";
import { PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND } from "../../../preview-layer";

import type * as types from "../../../../types";
import type { z } from "zod";

type ConfigItem = z.infer<typeof vals.template.configItem>;

export const QueryMappingSettings = (props: {
  queryMapping: types.TemplateConfig["queryMapping"];
  onChange: (queryMapping: types.TemplateConfig["queryMapping"]) => void;
}) => {
  const { queryMapping, onChange } = props;
  const [editor] = useLexicalComposerContext();

  // The URL param name being edited (key in the Record)
  const [editingParamName, setEditingParamName] = useState<string | null>(null);
  // Index of the item within the param being edited (null for adding new)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  // The item being edited (single configItem)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  // For editing the URL param name itself
  const [editingUrlParamName, setEditingUrlParamName] = useState<string>("");
  // Track if we're adding a new param entry
  const [isAddingNewParam, setIsAddingNewParam] = useState(false);

  const [configurableItems, setConfigurableItems] = useState<
    types.ConfigurableNodeItem[]
  >([]);
  const { wpHooks } = useWP();
  const { selectedNode } = useSelectedNode();

  // Load configurable node items from editor
  useEffect(() => {
    const items = getConfigurableNodeItems(editor);
    setConfigurableItems(items);
    wpHooks.action.addCommand(PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND, () => {
      const items = getConfigurableNodeItems(editor);
      setConfigurableItems(items);
    });
  }, [selectedNode]);

  /**
   * Generates display string for a param with multiple mappings.
   * Format: "[name1, name2]" with space after comma as per requirements
   */
  const getMappingsDisplayValue = (
    mappings: ConfigItem[] | undefined
  ): string => {
    if (!Array.isArray(mappings) || mappings.length === 0) return "";

    const names = mappings?.map((item) => item.name).filter(Boolean) || [];
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];

    // Multiple items: format as "[name1, name2]" with space after comma
    return `[${names.join(", ")}]`;
  };

  // Start editing an existing item in a param
  const handleStartEditItem = (paramName: string, itemIndex: number) => {
    setEditingParamName(paramName);
    setEditingUrlParamName(paramName);
    setEditingItemIndex(itemIndex);
    setEditingItem(
      queryMapping[paramName]?.[itemIndex] || {
        nodeType: "",
        name: "",
        queryKey: "",
      }
    );
    setIsAddingNewParam(false);
  };

  // Start adding a new item to an existing param
  const handleStartAddToParam = (paramName: string) => {
    setEditingParamName(paramName);
    setEditingUrlParamName(paramName);
    setEditingItemIndex(null); // null indicates adding new
    setEditingItem({ nodeType: "", name: "", queryKey: "" });
    setIsAddingNewParam(false);
  };

  // Start adding a new param entry
  const handleAddParam = () => {
    const existingCount = Object.keys(queryMapping).length;
    const newParamName = `param_${existingCount + 1}`;
    setEditingParamName(newParamName);
    setEditingUrlParamName(newParamName);
    setEditingItemIndex(null);
    setEditingItem({ nodeType: "", name: "", queryKey: "" });
    setIsAddingNewParam(true);
  };

  // Submit the edited/new item
  const handleSubmit = () => {
    if (!editingItem || editingParamName === null) return;

    const newQueryMapping = { ...queryMapping };
    const targetParamName = editingUrlParamName.trim() || editingParamName;

    // Validate URL param name
    const urlParamValidation =
      vals.template.urlParamName.safeParse(targetParamName);
    if (!urlParamValidation.success) {
      return;
    }

    // If the param name changed (for existing params), we need to delete old and create new
    if (editingParamName !== targetParamName && !isAddingNewParam) {
      const existingMappings = newQueryMapping[editingParamName] || [];
      delete newQueryMapping[editingParamName];
      newQueryMapping[targetParamName] = existingMappings;
    }

    // Ensure the mappings array exists and is iterable
    if (!Array.isArray(newQueryMapping[targetParamName])) {
      newQueryMapping[targetParamName] = [];
    } else {
      // Clone the array to avoid mutation
      newQueryMapping[targetParamName] = [...newQueryMapping[targetParamName]];
    }

    if (editingItemIndex !== null) {
      // Editing existing item
      newQueryMapping[targetParamName][editingItemIndex] = editingItem;
    } else {
      // Adding new item to param
      newQueryMapping[targetParamName].push(editingItem);
    }

    onChange(newQueryMapping);
    setEditingItemIndex(null);
    setEditingItem(null);
    setIsAddingNewParam(false);
    // Update the editing param name to the new name
    setEditingParamName(targetParamName);
  };

  // Cancel editing item (but keep param panel open if there are items)
  const handleCancelItem = () => {
    setEditingItemIndex(null);
    setEditingItem(null);
    // If we were adding a new param and cancelled, close the panel entirely
    if (isAddingNewParam) {
      handleCloseParamPanel();
    }
  };

  // Close the param panel entirely
  const handleCloseParamPanel = () => {
    setEditingParamName(null);
    setEditingItemIndex(null);
    setEditingItem(null);
    setEditingUrlParamName("");
    setIsAddingNewParam(false);
  };

  // Remove a specific item from a param
  const handleRemoveItem = (paramName: string, itemIndex: number) => {
    const newQueryMapping = { ...queryMapping };
    newQueryMapping[paramName] = (
      Array.isArray(newQueryMapping[paramName])
        ? newQueryMapping[paramName]
        : []
    ).filter((_, idx) => idx !== itemIndex);

    // If param is now empty, remove it entirely
    if (newQueryMapping[paramName].length === 0) {
      delete newQueryMapping[paramName];
      // Close panel if we removed the param
      if (editingParamName === paramName) {
        handleCloseParamPanel();
      }
    }

    onChange(newQueryMapping);
  };

  // Remove entire param
  const handleRemoveParam = (paramName: string) => {
    const newQueryMapping = { ...queryMapping };
    delete newQueryMapping[paramName];
    onChange(newQueryMapping);
    handleCloseParamPanel();
  };

  const paramEntries = Object.entries(queryMapping);
  const hasQueryMappings = paramEntries.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography size="medium" bold>
        Query Mapping
      </Typography>

      {!hasQueryMappings && editingParamName === null ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            p: 2,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            backgroundColor: "grey.50",
          }}
        >
          <Typography size="small" sx={{ color: "text.secondary" }}>
            Map URL query parameters to data nodes. A single query parameter can
            map to multiple nodes (1:many). Example: ?slug=hello-world can map
            the same value to both post and comments nodes.
          </Typography>
          <Button
            size="small"
            onClick={handleAddParam}
            sx={{ alignSelf: "flex-start" }}
          >
            Add Query Mapping
          </Button>
        </Box>
      ) : (
        <>
          {/* Display all query param mappings */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {paramEntries.map(([paramName, mappings]) => {
              const displayValue = getMappingsDisplayValue(mappings);

              return (
                <Box
                  key={paramName}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    border: "1px solid",
                    borderColor:
                      editingParamName === paramName
                        ? "primary.main"
                        : "grey.300",
                    borderRadius: 1,
                    backgroundColor:
                      editingParamName === paramName
                        ? "primary.lighter"
                        : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (editingParamName === paramName) {
                      handleCloseParamPanel();
                    } else {
                      setEditingParamName(paramName);
                      setEditingUrlParamName(paramName);
                      setEditingItemIndex(null);
                      setEditingItem(null);
                      setIsAddingNewParam(false);
                    }
                  }}
                >
                  <Typography size="small" bold sx={{ minWidth: "100px" }}>
                    ?{paramName}=
                  </Typography>
                  <Typography size="small" sx={{ flex: 1 }}>
                    {displayValue || "(not configured)"}
                  </Typography>
                  <Tooltip title="Remove Query Parameter">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveParam(paramName);
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>

          {/* Add new param button (when no panel is open) */}
          {editingParamName === null && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddParam}
              sx={{ alignSelf: "flex-start" }}
            >
              Add Query Parameter
            </Button>
          )}
        </>
      )}

      {/* Param edit panel: Shows when a param is clicked or new param is being added */}
      {editingParamName !== null && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pt: 1,
            pb: 1,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography size="small" bold>
              {isAddingNewParam ? "New Query Parameter" : "Query Parameter"}{" "}
              Mappings
            </Typography>
            <Tooltip title="Close">
              <IconButton size="small" onClick={handleCloseParamPanel}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* URL Param Name Editor */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography size="small" bold>
              URL Parameter Name
            </Typography>
            <Input
              size="medium"
              value={editingUrlParamName}
              onChange={(value) => {
                const result = vals.template.urlParamName.safeParse(value);
                setEditingUrlParamName(result.success ? result.data : value);
              }}
              placeholder="paramName"
              sx={{ maxWidth: "200px" }}
            />
          </Box>

          {/* List of existing items in this param */}
          {(Array.isArray(queryMapping[editingParamName])
            ? queryMapping[editingParamName]
            : []
          ).map((item, itemIndex) => (
            <Box
              key={itemIndex}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                backgroundColor: "grey.50",
                borderRadius: 1,
              }}
            >
              <Typography size="small" sx={{ flex: 1 }}>
                {item.name} ({item.queryKey}){item.required ? " *" : ""}
              </Typography>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEditItem(editingParamName, itemIndex)
                  }
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={() => handleRemoveItem(editingParamName, itemIndex)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}

          {/* Add new item button (when not currently editing an item) */}
          {editingItem === null && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleStartAddToParam(editingParamName)}
              sx={{ alignSelf: "flex-start" }}
            >
              Add Mapping to Parameter
            </Button>
          )}

          {/* Item edit form */}
          {editingItem &&
            (() => {
              // Get name options from configurable items
              const nameOptions = configurableItems.map((item) => ({
                label: item.name,
                value: item.name,
              }));

              // Find the selected item
              const selectedConfigItem = configurableItems.find(
                (item) => item.name === editingItem.name
              );

              // Get query key options based on selected name
              const queryKeyOptions = selectedConfigItem
                ? selectedConfigItem.queryKeys.map((key) => ({
                    label: key,
                    value: key,
                  }))
                : [];

              // Check if current mapping is invalid
              const isInvalidName = editingItem.name && !selectedConfigItem;
              const isInvalidQueryKey =
                editingItem.queryKey &&
                selectedConfigItem &&
                !selectedConfigItem.queryKeys.includes(editingItem.queryKey);

              // Check if submit should be disabled (missing required fields)
              const isSubmitDisabled = !!(
                !editingItem.name ||
                !editingItem.queryKey ||
                isInvalidName ||
                isInvalidQueryKey
              );

              return (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mt: 1,
                    p: 1,
                    border: "1px solid",
                    borderColor:
                      isInvalidName || isInvalidQueryKey
                        ? "error.main"
                        : "grey.200",
                    borderRadius: 1,
                    backgroundColor:
                      isInvalidName || isInvalidQueryKey
                        ? "error.lighter"
                        : "background.paper",
                  }}
                >
                  <Typography size="small" bold>
                    {editingItemIndex !== null ? "Edit Mapping" : "New Mapping"}
                  </Typography>
                  {isInvalidName && (
                    <Typography
                      size="small"
                      sx={{ color: "error.main", mb: 1 }}
                    >
                      Invalid configuration: The selected name "
                      {editingItem.name}" is not found in the configurable
                      nodes. Please select a valid name.
                    </Typography>
                  )}
                  {!isInvalidName && isInvalidQueryKey && (
                    <Typography
                      size="small"
                      sx={{ color: "error.main", mb: 1 }}
                    >
                      Invalid configuration: The query key "
                      {editingItem.queryKey}" is not available for "
                      {editingItem.name}". Please select a valid query key.
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {!isInvalidName && (
                      <>
                        <Box sx={{ flex: 1 }}>
                          <Typography size="small" bold sx={{ mb: 0.5 }}>
                            Name
                          </Typography>
                          <Select
                            size="medium"
                            enum={nameOptions}
                            value={editingItem.name}
                            onChange={(value) => {
                              const selectedItem = configurableItems.find(
                                (item) => item.name === value
                              );
                              setEditingItem({
                                ...editingItem,
                                name: value,
                                nodeType: selectedItem?.nodeType || "",
                                queryKey: "",
                              });
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography size="small" bold sx={{ mb: 0.5 }}>
                            Query Key
                          </Typography>
                          <Select
                            size="medium"
                            enum={queryKeyOptions}
                            value={editingItem.queryKey}
                            onChange={(value) =>
                              setEditingItem({
                                ...editingItem,
                                queryKey: value,
                              })
                            }
                            disabled={
                              !selectedConfigItem ||
                              queryKeyOptions.length === 0
                            }
                          />
                        </Box>
                        <Box sx={{ mt: 2.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={editingItem.required === true}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    required: e.target.checked,
                                  })
                                }
                              />
                            }
                            label={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Typography size="small">Required</Typography>
                                <HelpTooltip title="When checked, public page throws 404 if this query parameter is not provided in the URL." />
                              </Box>
                            }
                          />
                        </Box>
                      </>
                    )}
                    <Box sx={{ display: "flex", gap: 0.5, mt: 2.5 }}>
                      <Tooltip title="Save">
                        <span>
                          <IconButton
                            size="small"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            sx={{ color: "success.main" }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          onClick={handleCancelItem}
                          sx={{ color: "error.main" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              );
            })()}
        </Box>
      )}
    </Box>
  );
};
