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
import { useSelectedNode } from "../../../global-event";
import { PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND } from "../../../preview-layer";

import type * as types from "../../../../types";
import type { z } from "zod";
import type * as vals from "../../../../validators";

type ConfigItem = z.infer<typeof vals.template.configItem>;

export const PathMappingSettings = (props: {
  pathMapping: types.TemplateConfig["pathMapping"];
  onChange: (pathMapping: types.TemplateConfig["pathMapping"]) => void;
}) => {
  const { pathMapping, onChange } = props;
  const [editor] = useLexicalComposerContext();

  // Index of the segment being edited (outer array index)
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(
    null
  );
  // Index of the item within the segment being edited (inner array index), null for adding new
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  // The item being edited (single configItem)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);

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
   * Generates display string for a segment with multiple mappings.
   * Format: "[name1, name2]" with space after comma as per requirements
   */
  const getSegmentDisplayValue = (
    segment: types.TemplateConfig["pathMapping"][number] | undefined
  ): string => {
    if (!segment || !Array.isArray(segment) || segment.length === 0) return "";

    const names = segment.map((item) => item.name).filter(Boolean);
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];

    // Multiple items: format as "[name1, name2]" with space after comma
    return `[${names.join(", ")}]`;
  };

  // Start editing an existing item in a segment
  const handleStartEditItem = (segmentIndex: number, itemIndex: number) => {
    setEditingSegmentIndex(segmentIndex);
    setEditingItemIndex(itemIndex);
    setEditingItem(
      pathMapping[segmentIndex]?.[itemIndex] || {
        nodeType: "",
        name: "",
        queryKey: "",
      }
    );
  };

  // Start adding a new item to an existing or new segment
  const handleStartAddToSegment = (segmentIndex: number) => {
    setEditingSegmentIndex(segmentIndex);
    setEditingItemIndex(null); // null indicates adding new
    setEditingItem({ nodeType: "", name: "", queryKey: "" });
  };

  // Start adding a new segment (creates new outer array element)
  const handleAddSegment = () => {
    handleStartAddToSegment(pathMapping.length);
  };

  // Submit the edited/new item
  const handleSubmit = () => {
    if (!editingItem || editingSegmentIndex === null) return;

    const newPathMapping = [...pathMapping];

    // Ensure the segment array exists and is iterable
    if (!Array.isArray(newPathMapping[editingSegmentIndex])) {
      newPathMapping[editingSegmentIndex] = [];
    } else {
      // Clone the inner array to avoid mutation
      newPathMapping[editingSegmentIndex] = [
        ...newPathMapping[editingSegmentIndex],
      ];
    }

    if (editingItemIndex !== null) {
      // Editing existing item
      newPathMapping[editingSegmentIndex][editingItemIndex] = editingItem;
    } else {
      // Adding new item to segment
      newPathMapping[editingSegmentIndex].push(editingItem);
    }

    onChange(newPathMapping);
    setEditingItemIndex(null);
    setEditingItem(null);
    // Keep segment panel open for adding more items
  };

  // Cancel editing item (but keep segment panel open if there are items)
  const handleCancelItem = () => {
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  // Close the segment panel entirely
  const handleCloseSegmentPanel = () => {
    setEditingSegmentIndex(null);
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  // Remove a specific item from a segment
  const handleRemoveItem = (segmentIndex: number, itemIndex: number) => {
    const newPathMapping = [...pathMapping];
    newPathMapping[segmentIndex] = newPathMapping[segmentIndex].filter(
      (_, idx) => idx !== itemIndex
    );

    // If segment is now empty, remove it entirely
    if (newPathMapping[segmentIndex].length === 0) {
      newPathMapping.splice(segmentIndex, 1);
      // Close panel if we removed the segment
      if (editingSegmentIndex === segmentIndex) {
        handleCloseSegmentPanel();
      } else if (
        editingSegmentIndex !== null &&
        editingSegmentIndex > segmentIndex
      ) {
        // Adjust editing index if a previous segment was removed
        setEditingSegmentIndex(editingSegmentIndex - 1);
      }
    }

    onChange(newPathMapping);
  };

  // Remove entire segment
  const handleRemoveSegment = (segmentIndex: number) => {
    const newPathMapping = pathMapping.filter((_, idx) => idx !== segmentIndex);
    onChange(newPathMapping);
    handleCloseSegmentPanel();
  };

  // Calculate total number of path segments (configured + 1 unconfigured)
  const totalSegments = pathMapping.length + 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography size="medium" bold>
        Path Mapping
      </Typography>

      {pathMapping.length === 0 && editingSegmentIndex === null ? (
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
            Map URL path segments to data nodes. A single path segment can map
            to multiple nodes (1:many). Example: /[post, comments]/ maps the
            same slug to both post and comments nodes.
          </Typography>
          <Button
            size="small"
            onClick={handleAddSegment}
            sx={{ alignSelf: "flex-start" }}
          >
            Add Path Mapping
          </Button>
        </Box>
      ) : (
        <>
          {/* First line: Display all path segments in a single line */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {Array.from({ length: totalSegments }).map((_, segmentIndex) => {
              const segment = pathMapping[segmentIndex];
              const displayValue = getSegmentDisplayValue(segment);
              const isLastConfigured =
                segmentIndex === pathMapping.length - 1 &&
                pathMapping.length > 0;

              return (
                <Box
                  key={segmentIndex}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Typography>/</Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      position: "relative",
                    }}
                  >
                    <Input
                      size="medium"
                      isEmpty={!displayValue || displayValue.length === 0}
                      value={displayValue || " "}
                      readOnly
                      placeholder="Configure"
                      onClick={() => {
                        if (editingSegmentIndex === segmentIndex) {
                          handleCloseSegmentPanel();
                        } else {
                          setEditingSegmentIndex(segmentIndex);
                          setEditingItemIndex(null);
                          setEditingItem(null);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        minWidth: "100px",
                        maxWidth: "200px",
                        ...(editingSegmentIndex === segmentIndex
                          ? {
                              borderColor: "primary.main",
                              boxShadow:
                                "0 0 0 1px var(--mui-palette-primary-main)",
                            }
                          : {}),
                      }}
                    />
                    {isLastConfigured && (
                      <Tooltip title="Remove Segment">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSegment(segmentIndex);
                          }}
                          sx={{
                            color: "error.main",
                            position: "absolute",
                            right: 2,
                            padding: 0.5,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              );
            })}
            <Typography>/</Typography>
          </Box>
        </>
      )}

      {/* Segment edit panel: Shows when a segment is clicked */}
      {editingSegmentIndex !== null && (
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
              Segment {editingSegmentIndex + 1} Mappings
            </Typography>
            <Tooltip title="Close">
              <IconButton size="small" onClick={handleCloseSegmentPanel}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* List of existing items in this segment */}
          {(Array.isArray(pathMapping[editingSegmentIndex])
            ? pathMapping[editingSegmentIndex]
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
                    handleStartEditItem(editingSegmentIndex, itemIndex)
                  }
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleRemoveItem(editingSegmentIndex, itemIndex)
                  }
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
              onClick={() => handleStartAddToSegment(editingSegmentIndex)}
              sx={{ alignSelf: "flex-start" }}
            >
              Add Mapping to Segment
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

              // "Required" checkbox is only available for the first segment (index 0).
              // For subsequent segments, it is only available if the previous segment
              // has at least one item with required:true — otherwise it makes no sense
              // to require a later segment without also requiring the earlier one.
              const canSetRequired =
                editingSegmentIndex === 0 ||
                (pathMapping[editingSegmentIndex - 1] ?? []).some(
                  (item) => item.required === true
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
                        {canSetRequired && (
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
                                  <HelpTooltip title="When checked, public page throws 404 if this path segment is not provided in the URL." />
                                </Box>
                              }
                            />
                          </Box>
                        )}
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
