import React, { useDeferredValue, useEffect, useRef, useState } from "react";

import { Box, IconButton, Tooltip } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { StyleMouseInput } from "../../../forms/components";
import { formatCssValue, parseCssValue } from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";
import { SpacingAdvancedOptions } from "./SpacingAdvancedOptions";
import { RIGHT_PANEL_FORM_UPDATE_COMMAND } from "../../commands";

import type * as types from "../../../../types";
import { cssKeyToCamelCase } from "../../../../lexical/styles/css-variables";

const SPACING_KEYS = [
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
] as const;

type SpacingValues = Record<(typeof SPACING_KEYS)[number], string>;

const getSpacingFromFormData = (
  formData: Record<string, any> | undefined
): SpacingValues => ({
  paddingTop: `${formData?.paddingTop ?? 0}`,
  paddingBottom: `${formData?.paddingBottom ?? 0}`,
  paddingLeft: `${formData?.paddingLeft ?? 0}`,
  paddingRight: `${formData?.paddingRight ?? 0}`,
  marginTop: `${formData?.marginTop ?? 0}`,
  marginBottom: `${formData?.marginBottom ?? 0}`,
  marginLeft: `${formData?.marginLeft ?? 0}`,
  marginRight: `${formData?.marginRight ?? 0}`,
});

export const StyleSpacing = () => {
  const { formDataRef, updateFormData, formDataSignal, formKey } =
    useStyleForm();
  const { wpHooks } = useWP();

  const [spacing, setSpacing] = useState<SpacingValues>(() =>
    getSpacingFromFormData(formDataRef.current)
  );
  const deferredSpacing = useDeferredValue(spacing);

  const prevSpacingRef = useRef<SpacingValues>(spacing);

  // Sync spacing state when formKey changes (e.g., node selection change)
  useEffect(() => {
    const newSpacing = getSpacingFromFormData(formDataRef.current);
    setSpacing(newSpacing);
    prevSpacingRef.current = newSpacing;
  }, [formKey]);

  // Listen for form updates and update spacing state only if spacing values changed
  useEffect(() => {
    return wpHooks.action.addCommand(
      RIGHT_PANEL_FORM_UPDATE_COMMAND,
      ({ formData }) => {
        const newSpacing = getSpacingFromFormData(formData);

        // Check if any spacing value changed
        const hasSpacingChanged = SPACING_KEYS.some(
          (key) => newSpacing[key] !== prevSpacingRef.current[key]
        );

        if (!hasSpacingChanged) {
          return; // Drop command if no spacing changes
        }

        prevSpacingRef.current = newSpacing;
        setSpacing(newSpacing);
      }
    );
  }, [wpHooks]);

  const ref = useRef<HTMLDivElement>(null);

  const handleResetAll = () => {
    updateFormData({
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      marginRight: "0px",
    });
  };

  const handleInputChange =
    (
      position: "top" | "bottom" | "left" | "right",
      spacingType: "margin" | "padding"
    ) =>
    (value: string | undefined) => {
      let { value: numValue, unit } = parseCssValue(value);

      const cssCamelCase = cssKeyToCamelCase(
        `${spacingType}-${position}`
      ) as keyof types.CSSKeyValue;

      let newValueUnit = {
        value: String(
          unit === "auto"
            ? ""
            : unit === "em" || unit === "rem"
              ? parseFloat(numValue)
              : parseInt(numValue)
        ),
        unit: unit ?? "px",
      };

      if (spacingType === "padding" && parseFloat(newValueUnit.value) < 0) {
        // Ensure padding value is not negative
        newValueUnit.value = "0";
      }

      updateFormData({
        [cssCamelCase]: formatCssValue(newValueUnit),
      });

      return newValueUnit;
    };

  const handleDeltaChange =
    (
      position: "top" | "bottom" | "left" | "right",
      spacingType: "margin" | "padding"
    ) =>
    (e: MouseEvent, delta: { x: number; y: number }) => {
      const deltaValue =
        position === "top" || position === "bottom" ? delta.y : delta.x;

      const cssCamelCase = cssKeyToCamelCase(
        `${spacingType}-${position}`
      ) as keyof types.CSSKeyValue;

      const currentValueUnit = parseCssValue(
        formDataRef.current?.[cssCamelCase] ?? 0
      );

      let newValue =
        parseFloat(currentValueUnit.value) +
        (deltaValue > 0
          ? Math.min(Math.ceil(deltaValue), 3)
          : Math.max(Math.floor(deltaValue), -3));

      if (spacingType === "padding" && newValue < 0) {
        // Ensure padding value is not negative
        newValue = 0;
      }

      const unit = currentValueUnit.unit ?? "px";

      updateFormData({
        [cssCamelCase]: formatCssValue({
          value: newValue.toString(),
          unit,
        }),
      });

      return {
        value: newValue.toString(),
        unit,
      };
    };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 0.5,
        }}
      >
        <Tooltip title="Reset all spacing to 0">
          <IconButton
            size="small"
            onClick={handleResetAll}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        key={formKey}
        ref={ref}
        sx={{
          width: "100%",
          height: 150,
          backgroundColor: (theme) => theme.palette.grey[200],
          position: "relative",
        }}
      >
        {(["top", "bottom"] as const).map((pos) => (
          <StyleMouseInput
            key={`${pos}-${formDataSignal.value.marginTop}`}
            ref={ref}
            keyofUsage={pos === "top" ? "marginTop" : "marginBottom"}
            sx={{ [pos]: 0, left: "16%", width: "68%", height: "20%" }}
            direction="vertical"
            value={
              deferredSpacing[pos === "top" ? "marginTop" : "marginBottom"]
            }
            //value={formDataSignal.value.marginTop as any}
            onDeltaChange={handleDeltaChange(pos, "margin")}
            onInputChange={handleInputChange(pos, "margin")}
            min={(unit) => (unit === "em" || unit === "rem" ? -50 : -200)}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => {
              return unit === "em" || unit === "rem" ? 0.1 : 1;
            }}
          />
        ))}
        {(["left", "right"] as const).map((pos) => (
          <StyleMouseInput
            key={pos}
            ref={ref}
            keyofUsage={pos === "left" ? "marginLeft" : "marginRight"}
            sx={{ top: 0, [pos]: 0, width: "15%", height: "100%" }}
            direction="horizontal"
            value={
              deferredSpacing[pos === "left" ? "marginLeft" : "marginRight"]
            }
            onDeltaChange={handleDeltaChange(pos, "margin")}
            onInputChange={handleInputChange(pos, "margin")}
            min={0}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => (unit === "em" || unit === "rem" ? 0.1 : 1)}
          />
        ))}
        {(["top", "bottom"] as const).map((pos) => (
          <StyleMouseInput
            key={pos}
            ref={ref}
            keyofUsage={pos === "top" ? "paddingTop" : "paddingBottom"}
            sx={{ [pos]: 33, left: "32%", width: "36%", height: "20%" }}
            direction="vertical"
            value={
              deferredSpacing[pos === "top" ? "paddingTop" : "paddingBottom"]
            }
            onDeltaChange={handleDeltaChange(pos, "padding")}
            onInputChange={handleInputChange(pos, "padding")}
            min={(unit) => (unit === "em" || unit === "rem" ? -50 : 0)}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => (unit === "em" || unit === "rem" ? 0.1 : 1)}
          />
        ))}
        {(["left", "right"] as const).map((pos) => (
          <StyleMouseInput
            key={pos}
            ref={ref}
            keyofUsage={pos === "left" ? "paddingLeft" : "paddingRight"}
            sx={{ top: 33, [pos]: "16%", width: "15%", height: "56%" }}
            direction="horizontal"
            value={
              deferredSpacing[pos === "left" ? "paddingLeft" : "paddingRight"]
            }
            onDeltaChange={handleDeltaChange(pos, "padding")}
            onInputChange={handleInputChange(pos, "padding")}
            min={0}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => (unit === "em" || unit === "rem" ? 0.1 : 1)}
          />
        ))}
      </Box>
      <SpacingAdvancedOptions />
    </>
  );
};
