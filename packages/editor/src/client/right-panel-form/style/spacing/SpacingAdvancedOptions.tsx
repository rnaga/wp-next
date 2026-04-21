import { useState } from "react";
import { Box, Collapse, Tooltip, Stack } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { useStyleForm } from "../use-style-form";
import {
  FormFlexBox,
  FormStyleControl,
} from "../../../forms/components/Form";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";

type SpacingMode = "vertical" | "horizontal" | "all";

const spacingModes: { value: SpacingMode; label: string; tooltip: string }[] = [
  { value: "vertical", label: "↕", tooltip: "Top & Bottom" },
  { value: "horizontal", label: "↔", tooltip: "Left & Right" },
  { value: "all", label: "⊞", tooltip: "All directions" },
];

export const SpacingAdvancedOptions = () => {
  const { formDataRef, updateFormData } = useStyleForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [paddingMode, setPaddingMode] = useState<SpacingMode>("vertical");
  const [marginMode, setMarginMode] = useState<SpacingMode>("vertical");

  const handlePaddingChange = (value: string | undefined) => {
    if (value === undefined) return;

    const updates: Record<string, string> = {};

    if (paddingMode === "vertical" || paddingMode === "all") {
      updates.paddingTop = value;
      updates.paddingBottom = value;
    }
    if (paddingMode === "horizontal" || paddingMode === "all") {
      updates.paddingLeft = value;
      updates.paddingRight = value;
    }

    updateFormData(updates);
  };

  const handleMarginChange = (value: string | undefined) => {
    if (value === undefined) return;

    const updates: Record<string, string> = {};

    if (marginMode === "vertical" || marginMode === "all") {
      updates.marginTop = value;
      updates.marginBottom = value;
    }
    if (marginMode === "horizontal" || marginMode === "all") {
      updates.marginLeft = value;
      updates.marginRight = value;
    }

    updateFormData(updates);
  };

  const getPaddingValue = (): string | undefined => {
    const top = formDataRef.current?.paddingTop;
    const bottom = formDataRef.current?.paddingBottom;
    const left = formDataRef.current?.paddingLeft;
    const right = formDataRef.current?.paddingRight;

    if (paddingMode === "vertical") {
      return top === bottom ? String(top ?? "") : "";
    }
    if (paddingMode === "horizontal") {
      return left === right ? String(left ?? "") : "";
    }
    // all mode
    if (top === bottom && top === left && top === right) {
      return String(top ?? "");
    }
    return "";
  };

  const getMarginValue = (): string | undefined => {
    const top = formDataRef.current?.marginTop;
    const bottom = formDataRef.current?.marginBottom;
    const left = formDataRef.current?.marginLeft;
    const right = formDataRef.current?.marginRight;

    if (marginMode === "vertical") {
      return top === bottom ? String(top ?? "") : "";
    }
    if (marginMode === "horizontal") {
      return left === right ? String(left ?? "") : "";
    }
    // all mode
    if (top === bottom && top === left && top === right) {
      return String(top ?? "");
    }
    return "";
  };

  const ModeSelector = (props: {
    value: SpacingMode;
    onChange: (mode: SpacingMode) => void;
  }) => (
    <Box sx={{ display: "flex", gap: 0.25 }}>
      {spacingModes.map((mode) => (
        <Tooltip key={mode.value} title={mode.tooltip} arrow>
          <Button
            size="small"
            onClick={() => props.onChange(mode.value)}
            sx={{
              textTransform: "none",
              fontSize: "0.85rem",
              py: 0.25,
              px: 0.5,
              minWidth: 28,
              backgroundColor:
                props.value === mode.value
                  ? "primary.main"
                  : "rgba(0, 0, 0, 0.08)",
              color: props.value === mode.value ? "white" : "text.secondary",
              "&:hover": {
                backgroundColor:
                  props.value === mode.value
                    ? "primary.dark"
                    : "rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            {mode.label}
          </Button>
        </Tooltip>
      ))}
    </Box>
  );

  return (
    <>
      <Button
        size="small"
        onClick={() => setShowAdvanced(!showAdvanced)}
        endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(0, 0, 0, 0.08)",
          color: "text.secondary",
          fontSize: "0.75rem",
          width: "100%",
          py: 0.5,
          mt: 1,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {showAdvanced ? "Hide" : "Show"} more options
      </Button>

      <Collapse in={showAdvanced}>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography sx={{ fontSize: "0.75rem" }}>Padding</Typography>
              <ModeSelector value={paddingMode} onChange={setPaddingMode} />
            </Box>
            <StyleLengthInput
              value={getPaddingValue()}
              onChange={handlePaddingChange}
              min={0}
              excludeUnits={["deg", "ms"]}
            />
          </Box>

          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography sx={{ fontSize: "0.75rem" }}>Margin</Typography>
              <ModeSelector value={marginMode} onChange={setMarginMode} />
            </Box>
            <StyleLengthInput
              value={getMarginValue()}
              onChange={handleMarginChange}
              excludeUnits={["deg", "ms"]}
            />
          </Box>
        </Stack>
      </Collapse>
    </>
  );
};
