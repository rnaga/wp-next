import { useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, HISTORY_MERGE_TAG } from "lexical";
import {
  Box,
  IconButton,
  sliderClasses,
  SxProps,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Button } from "@rnaga/wp-next-ui/Button";

import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { $isWPLexicalNode, WPElementNode, WPTextNode } from "..";
import { ConditionTab } from "./dynamic-attributes/ConditionTab";
import { RuleList } from "./dynamic-attributes/RuleList";
import {
  DynamicAttributesProvider,
  useDynamicAttributes,
} from "./dynamic-attributes/DynamicAttributesContext";
import { ManipulationTab } from "./dynamic-attributes/ManipulationTab";
import {
  CSS_EDITOR_MODE_CONFIG_HIDDEN,
  DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN,
} from "../../../constants";

import type { WPLexicalNode } from "../types";
import type { DynamicAttributeRule } from "../../../dynamic-attributes/types";
import { dataKeysExist } from "../../data-fetching/getKeysWithTypes";
import { $widgetVariantsExist } from "../../widget/WidgetNode";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { setEditorModeConfig } from "../../../editor-mode-config";

const TabPanel = (props: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) => {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dynamic-attrs-tabpanel-${index}`}
      aria-labelledby={`dynamic-attrs-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

export const DynamicAttributesForm = (props: {
  targetNode?: WPElementNode | WPTextNode;
  title?: string;
  sx?: SxProps;
  isChild?: boolean;
}) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [rules, setRules] = useState<DynamicAttributeRule[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const handleSaveRule = (rule: DynamicAttributeRule, index: number | null) => {
    if (!selectedNode || !$isWPLexicalNode(selectedNode)) return;

    editor.update(
      () => {
        const writable = selectedNode.getWritable() as WPLexicalNode;

        if (index !== null && index >= 0) {
          writable.__dynamicAttributes.updateRule(index, rule);
        } else {
          writable.__dynamicAttributes.addRule(rule);
        }

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
      },
      { discrete: true }
    );
  };

  const handleDeleteRule = (index: number) => {
    if (!selectedNode || !$isWPLexicalNode(selectedNode)) return;

    editor.update(
      () => {
        const writable = selectedNode.getWritable() as WPLexicalNode;
        writable.__dynamicAttributes.removeRule(index);

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
      },
      { discrete: true }
    );
  };

  const handleHideToggle = () => {
    if (!selectedNode || !$isWPLexicalNode(selectedNode)) return;

    const nextHidden = !isHidden;

    const latestNode = editor.read(() =>
      selectedNode.getLatest()
    ) as WPLexicalNode;

    // Update editor mode config for the node, cache it in the editor, then trigger and brodcast the event via editor command.
    setEditorModeConfig(editor, latestNode, "dynamicAttributes", {
      [DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN]: nextHidden,
    });

    // Trigger update to re-render the form with the new hidden state and broadcast the change to other listeners (e.g. preview).
    editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: latestNode });
  };

  useEffect(() => {
    if (!selectedNode || !$isWPLexicalNode(selectedNode)) {
      setRules([]);
      setIsHidden(false);
      return;
    }

    const nodeKey = selectedNode.getKey();

    const updateState = (editorState = editor.getEditorState()) => {
      editorState.read(() => {
        const latestNode = $getNodeByKey(nodeKey) as WPLexicalNode | null;
        setRules(latestNode?.__dynamicAttributes?.getRules() ?? []);
        setIsHidden(
          !!latestNode?.__dynamicAttributes?.getEditorModeConfig(
            DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN
          )
        );
      });
    };

    updateState();

    return editor.registerUpdateListener(({ editorState }) => {
      updateState(editorState);
    });
  }, [editor, selectedNode]);

  if (
    !selectedNode ||
    !$isWPLexicalNode(selectedNode) ||
    !editor.read(() => dataKeysExist(selectedNode) || $widgetVariantsExist())
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        mx: props.isChild ? 0 : 2,
        mt: props.isChild ? 2 : 1,
        ...props.sx,
      }}
    >
      <DynamicAttributesProvider>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <RightPanelSectionTitle title={props.title || "Dynamic Attributes"} />
          {rules.length > 0 && (
            <Tooltip
              title={
                isHidden
                  ? "Dynamic attributes hidden (click to show)"
                  : "Hide dynamic attributes in preview"
              }
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleHideToggle}
                sx={{ ml: "auto", p: 0.25 }}
              >
                {isHidden ? (
                  <VisibilityOffIcon sx={{ fontSize: 14 }} />
                ) : (
                  <VisibilityIcon sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <DynamicAttributesFormContent
          rules={rules}
          isHidden={isHidden}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
        />
      </DynamicAttributesProvider>
    </Box>
  );
};

const DynamicAttributesFormContent = (props: {
  rules: DynamicAttributeRule[];
  isHidden: boolean;
  onSaveRule: (rule: DynamicAttributeRule, index: number | null) => void;
  onDeleteRule: (index: number) => void;
}) => {
  const { rules, isHidden, onSaveRule, onDeleteRule } = props;
  const [editor] = useLexicalComposerContext();
  const {
    editingIndex,
    isEditing,
    endEditing,
    getDraft,
    adjustEditingIndexAfterDelete,
  } = useDynamicAttributes();
  const [tabValue, setTabValue] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmit = () => {
    const rule = getDraft();
    onSaveRule(rule, editingIndex >= 0 ? editingIndex : null);
    endEditing();
  };

  const handleDelete = (index: number) => {
    onDeleteRule(index);
    adjustEditingIndexAfterDelete(index);
  };

  const handleClose = () => {
    endEditing();
  };

  const title =
    editingIndex >= 0 ? `Editing Rule ${editingIndex + 1}` : "New Rule";

  return (
    <Box
      ref={containerRef}
      sx={isHidden ? { cursor: "not-allowed", pointerEvents: "none" } : {}}
    >
      <RuleList rules={rules} isHidden={isHidden} onDelete={handleDelete} />

      {isEditing && (
        <DraggableBox
          open={isEditing}
          onClose={handleClose}
          title={title}
          targetRef={containerRef}
          sx={{
            minWidth: 420,
            maxWidth: 500,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ minHeight: 36 }}
              >
                <Tab
                  label="Conditions"
                  sx={{
                    minHeight: 36,
                    py: 0,
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 40,
                  }}
                />
                <Tab
                  label="Settings"
                  sx={{
                    minHeight: 36,
                    py: 0,
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 40,
                  }}
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <ConditionTab />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <ManipulationTab />
            </TabPanel>

            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" onClick={handleSubmit}>
                Submit
              </Button>
              <Button size="small" onClick={handleClose} color="error">
                Cancel
              </Button>
            </Box>
          </Box>
        </DraggableBox>
      )}
    </Box>
  );
};
