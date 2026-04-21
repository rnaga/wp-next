import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, IconButton, Tooltip, Switch } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { Button } from "@rnaga/wp-next-ui/Button";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useDataFetchingDataInput } from "../../../data-fetching/client/DataFetchingDataInputContext";
import { getAllKeysWithTypes } from "../../../data-fetching/getKeysWithTypes";
import { useDynamicAttributes } from "./DynamicAttributesContext";

import type {
  ConditionOperator,
  KeyWithType,
} from "../../../../dynamic-attributes/types";
import { OPERATORS_BY_TYPE as operatorsByType } from "../../../../dynamic-attributes/types";
import { useSelectedNode } from "../../../../../client/global-event";
import { useTemplate } from "../../../../../client/template/use-template";
import { $isWPLexicalNode } from "../../";
import { logger } from "../../../../logger";

export const ConditionTab = () => {
  const [editor] = useLexicalComposerContext();
  const { dataKeys, widgetVariantKeys, paginationKeys } =
    useDataFetchingDataInput();
  const { selectedNode } = useSelectedNode();
  const { current } = useTemplate();

  const {
    draftRule,
    setConditionOperator,
    addCondition,
    updateCondition,
    removeCondition,
  } = useDynamicAttributes();

  const [keysWithTypes, setKeysWithTypes] = useState<KeyWithType[]>([]);

  // Load keys with types from editor
  useEffect(() => {
    editor.read(() => {
      const node =
        selectedNode && $isWPLexicalNode(selectedNode)
          ? selectedNode
          : undefined;
      const keys = getAllKeysWithTypes(node);
      setKeysWithTypes(keys);
    });
  }, [editor, dataKeys, selectedNode]);

  const handleConditionOperatorChange = (value: string | undefined) => {
    if (value === "any" || value === "all") {
      setConditionOperator(value);
    }
  };

  const getKeyType = (key: string): string => {
    const found = keysWithTypes.find((k) => k.key === key);
    logger.log( "getKeyType: [", key, "] - [", keysWithTypes, "]");
    if (found) return found.zodType;

    // Check if this is a widget variant key: ${%variant.name}
    const variantMatch = key.match(/^\$\{%variant\.(.+)\}$/);
    if (variantMatch) {
      const variantName = variantMatch[1];
      const variantType =
        current.template?.template_config?.widgetVariants?.[variantName]?.[0];
      if (variantType) return variantType;
    }

    return "unknown";
  };

  const getOperatorsForKey = (key: string) => {
    const keyType = getKeyType(key);
    return operatorsByType[keyType] ?? operatorsByType.unknown;
  };

  // Build key options from dataKeys (for compatibility) and keysWithTypes
  const keyOptions = [
    ...widgetVariantKeys.map((key) => ({
      label: key, // Replace prefix for better readability//key,
      value: `\${${key}}`,
    })),
    ...paginationKeys.map((key) => ({
      label: key,
      value: `\${${key}}`,
    })),
    ...dataKeys.map((key) => ({
      label: key,
      value: `\${${key}}`,
    })),
    // ...keysWithTypes
    //   .filter((k) => !dataKeys.some((dk) => `\${${dk}}` === k.key))
    //   .map((k) => ({
    //     label: k.key,
    //     value: k.key,
    //   })),
  ];

  const { conditions, conditionOperator } = draftRule;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography size="small" sx={{ fontWeight: 600 }}>
          Conditions
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography size="small" sx={{ fontWeight: 600 }}>
            Match
          </Typography>
          <Typography size="small">All</Typography>
          <Switch
            size="small"
            checked={conditionOperator === "any"}
            onChange={(event) =>
              handleConditionOperatorChange(
                event.target.checked ? "any" : "all"
              )
            }
          />
          <Typography size="small">Any</Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {conditions.length === 0 && (
          <Typography size="small" sx={{ color: "text.secondary" }}>
            No conditions added yet. Click "Add Condition" to create one.
          </Typography>
        )}

        {conditions.map((condition, index) => {
          const operators = getOperatorsForKey(condition.key);
          const keyType = getKeyType(condition.key);

          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.5,
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 1,
                backgroundColor: "grey.50",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography size="small" sx={{ flex: 1, fontWeight: 500 }}>
                  Condition {index + 1}
                </Typography>
                <Tooltip title="Delete condition">
                  <IconButton
                    size="small"
                    onClick={() => removeCondition(index)}
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box>
                  <Typography size="small" sx={{ mb: 0.5 }}>
                    Data Key
                  </Typography>
                  <Select
                    size="small"
                    value={condition.key}
                    enum={keyOptions}
                    onChange={(value) => {
                      updateCondition(index, "key", value);
                      // Reset operator to first valid operator for that type
                      const newKeyType = getKeyType(value);
                      const newOperators =
                        operatorsByType[newKeyType] ?? operatorsByType.unknown;
                      updateCondition(index, "operator", newOperators[0].value);
                    }}
                    sx={{ width: "100%" }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography size="small" sx={{ mb: 0.5 }}>
                      Operator
                    </Typography>
                    <Select
                      size="small"
                      value={condition.operator}
                      enum={operators.map((op) => ({
                        label: op.label,
                        value: op.value,
                      }))}
                      onChange={(value) =>
                        updateCondition(
                          index,
                          "operator",
                          value as ConditionOperator
                        )
                      }
                      sx={{ width: "100%" }}
                    />
                  </Box>

                  {keyType !== "boolean" && (
                    <Box sx={{ flex: 1 }}>
                      <Typography size="small" sx={{ mb: 0.5 }}>
                        Value
                      </Typography>
                      <Input
                        size="small"
                        type={
                          keyType === "number"
                            ? "number"
                            : keyType === "date"
                              ? "date"
                              : "text"
                        }
                        value={String(condition.value)}
                        onChange={(value) =>
                          updateCondition(
                            index,
                            "value",
                            keyType === "number" ? Number(value) : (value ?? "")
                          )
                        }
                        sx={{ width: "100%" }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addCondition}
          sx={{ alignSelf: "flex-start" }}
        >
          Add Condition
        </Button>
      </Box>
    </Box>
  );
};
