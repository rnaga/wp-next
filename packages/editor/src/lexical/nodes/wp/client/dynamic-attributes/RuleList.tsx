import { Box, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useDynamicAttributes } from "./DynamicAttributesContext";

import type { DynamicAttributeRule } from "../../../../dynamic-attributes/types";

interface RuleListProps {
  rules: DynamicAttributeRule[];
  onDelete: (index: number) => void;
  // When true, edit/delete actions are hidden and the list is read-only
  isHidden?: boolean;
}

export const RuleList = (props: RuleListProps) => {
  const { rules, onDelete, isHidden } = props;
  const { startEditing, startNew } = useDynamicAttributes();

  const getConditionSummary = (rule: DynamicAttributeRule): string => {
    if (rule.conditions.length === 0) {
      return "No conditions";
    }
    const count = rule.conditions.length;
    const operator = rule.conditionOperator === "any" ? "OR" : "AND";
    return `${count} condition${count > 1 ? "s" : ""} (${operator})`;
  };

  const getSettingsSummary = (rule: DynamicAttributeRule): string => {
    const parts: string[] = [];

    if (!rule.settings.display) {
      parts.push("Hidden");
    }

    if (rule.settings.externalClassnames?.length) {
      parts.push(`${rule.settings.externalClassnames.length} classes`);
    }

    const attrCount = Object.keys(rule.settings.customAttributes || {}).length;
    if (attrCount > 0) {
      parts.push(`${attrCount} attr${attrCount > 1 ? "s" : ""}`);
    }

    return parts.length > 0 ? parts.join(", ") : "Default settings";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {rules.length === 0 ? (
        <Box
          sx={{
            p: 1,
            border: "1px dashed",
            borderColor: "grey.300",
            borderRadius: 1,
            textAlign: "center",
            width: "100%",
          }}
        >
          <Typography size="small" sx={{ color: "text.secondary", mb: 1 }}>
            No rules yet
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={startNew}
            sx={{
              width: "100%",
            }}
          >
            Add Rule
          </Button>
        </Box>
      ) : (
        <>
          {rules.map((rule, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 1,
                backgroundColor: "grey.50",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "primary.lighter",
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography size="small" sx={{ fontWeight: 500 }}>
                  Rule {index + 1}
                </Typography>
                <Typography
                  size="small"
                  sx={{ color: "text.secondary", fontSize: 11 }}
                >
                  {getConditionSummary(rule)} | {getSettingsSummary(rule)}
                </Typography>
              </Box>

              {!isHidden && (
                <>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => startEditing(rule, index)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(index)}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          ))}

          {!isHidden && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={startNew}
              sx={{ alignSelf: "flex-start", mt: 1 }}
            >
              Add Rule
            </Button>
          )}
        </>
      )}
    </Box>
  );
};
