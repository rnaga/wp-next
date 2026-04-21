import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HISTORY_MERGE_TAG } from "lexical";
import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { processAllWidgetsSync } from "../WidgetNode";

import { SelectTemplate } from "../../../../client/forms/components";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { useSelectedNode } from "../../../../client/global-event";
import { useEditorServerActions } from "../../../../client/hooks/use-editor-server-actions";
import {
  TEMPLATE_SLUG_HOMEPAGE,
  TEMPLATE_SLUGS_RESERVED,
} from "../../../constants";
import { WIDGET_SELECTED } from "../commands";
import { $isWidgetNode } from "../WidgetNode";

import type * as types from "../../../../types";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event/commands";

export const WidgetRightPanelForm = () => {
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();
  const [widgetSlug, setWidgetSlug] = useState<string | undefined>(undefined);
  const [widgetId, setWidgetId] = useState<number | undefined>(undefined);
  const { actions, parse } = useEditorServerActions();

  // Widget variant definitions from the selected template
  const [variantDefs, setVariantDefs] = useState<types.WidgetVariants>({});
  // Widget variant values stored on the WidgetNode
  const [variantValues, setVariantValues] = useState<
    Record<string, string | number | boolean>
  >({});

  useEffect(() => {
    if (!$isWidgetNode(selectedNode)) return;

    const slug = selectedNode.slug;

    // SelectTemplate needs the template ID to set the selected value in the dropdown
    const fetchAndSetWidget = async () => {
      const [template] = await actions.template.get(slug).then(parse);
      setWidgetSlug(template.post_name);
      setWidgetId(template.ID);
      const defs =
        (template as types.Template).template_config?.widgetVariants ?? {};
      setVariantDefs(defs);
      // Load existing variant values from the node, applying defaults for unset variants
      const existing = selectedNode.widgetVariantValues ?? {};
      const withDefaults = { ...existing };
      for (const [vName, [, defVal]] of Object.entries(defs)) {
        if (withDefaults[vName] === undefined && defVal !== null) {
          withDefaults[vName] = defVal;
        }
      }
      setVariantValues(withDefaults);
    };

    // If the widget has a slug, fetch the template data to get the template ID and set it in the state.
    if (slug) {
      fetchAndSetWidget();
    } else {
      setVariantDefs({});
      setVariantValues({});
    }
  }, [selectedNode]);

  const handleChange = (ID: number) => {
    if (!$isWidgetNode(selectedNode)) return;

    const fetchWidgetSlugAndDispatch = async () => {
      const [template] = await actions.template.get(ID).then(parse);
      const slug = template.post_name;
      setWidgetSlug(slug);
      const defs =
        (template as types.Template).template_config?.widgetVariants ?? {};
      setVariantDefs(defs);
      // Initialize variant values with defaults for new template selection
      const defaults: Record<string, string | number | boolean> = {};
      for (const [vName, [, defVal]] of Object.entries(defs)) {
        if (defVal !== null) defaults[vName] = defVal;
      }
      setVariantValues(defaults);
      editor.dispatchCommand(WIDGET_SELECTED, {
        node: selectedNode,
        slug,
      });
    };

    fetchWidgetSlugAndDispatch();
  };

  const updateVariantValue = (
    name: string,
    value: string | number | boolean | null
  ) => {
    const newValues = { ...variantValues };
    if (value === null) {
      delete newValues[name];
    } else {
      newValues[name] = value;
    }
    setVariantValues(newValues);

    // Persist to the WidgetNode
    editor.update(
      () => {
        if (!$isWidgetNode(selectedNode)) return;
        const writable = selectedNode.getWritable();
        writable.widgetVariantValues = newValues;
      },
      { tag: HISTORY_MERGE_TAG }
    );

    // Re-process all widgets to ensure the updated variant values are applied in the preview
    processAllWidgetsSync(editor);

    // This will re-render the moust tool
    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: selectedNode!,
      type: "input",
    });
  };

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        mb: 20,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <RightPanelSectionTitle title="Select Template" />
      </Box>
      <SelectTemplate
        size="small"
        value={widgetId}
        onChange={handleChange}
        // Exclude reserved templates and homepage template from the dropdown
        // they cannot be selected in the widget
        excludeSlugs={[...TEMPLATE_SLUGS_RESERVED, TEMPLATE_SLUG_HOMEPAGE]}
      />
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderLeft: "3px solid",
          borderColor: "primary.main",
          bgcolor: "action.hover",
          borderRadius: "0 4px 4px 0",
          lineHeight: 1.6,
        }}
      >
        <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
          Select a template to display in this widget.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.5 }}
        >
          The selected template will be rendered inside the widget.
        </Typography>
      </Box>

      {Object.keys(variantDefs).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <RightPanelSectionTitle title="Widget Variants" />
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}
          >
            {Object.entries(variantDefs).map(([name, [type, defaultValue]]) => (
              <Box key={name}>
                <Typography
                  size="small"
                  sx={{ mb: 0.5, color: "text.secondary" }}
                >
                  {name}{" "}
                  <Typography
                    component="span"
                    size="small"
                    sx={{ color: "text.disabled" }}
                  >
                    ({type})
                  </Typography>
                </Typography>
                {type === "boolean" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      checked={variantValues[name] === true}
                      onChange={(e) => {
                        updateVariantValue(
                          name,
                          e.target.checked ? true : null
                        );
                      }}
                    />
                    <Typography size="small">
                      {variantValues[name] === true ? "true" : "false"}
                    </Typography>
                  </Box>
                ) : (
                  <Input
                    size="small"
                    type={type === "number" ? "number" : "text"}
                    value={
                      variantValues[name] != null
                        ? String(variantValues[name])
                        : ""
                    }
                    isEmpty={variantValues[name] == null}
                    clearable
                    onClear={() => {
                      updateVariantValue(name, null);
                    }}
                    onChange={(value) => {
                      updateVariantValue(
                        name,
                        !value
                          ? null
                          : type === "number"
                            ? Number(value)
                            : value
                      );
                    }}
                    placeholder={
                      defaultValue != null
                        ? `Default: ${defaultValue}`
                        : `Enter ${type} value`
                    }
                    sx={{ width: "100%" }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
