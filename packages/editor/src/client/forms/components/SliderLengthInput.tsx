import { RefObject, useEffect, useState } from "react";
import { useCSSVariablesItem } from "../../css-variables/CSSVariablesItemContext";
import { CSSVariableBadgeContainer } from "./CSSVariableBadge";
import { StyleLengthInput } from "./StyleLengthInput";
import { Box, Slider, SxProps } from "@mui/material";
import { LengthInput } from "./LengthInput";
import type * as types from "../../../types";
import { parseLengthValue } from "../../../lexical/styles/length-value";

export const SliderLengthInput = (props: {
  ref?: RefObject<HTMLDivElement | null>;
  size?: "small" | "medium";
  enableMouseEvent?: boolean;
  onChange: (value: string | undefined) => void;
  value: string;
  excludeUnits?: types.LengthUnit[];
  includeUnits?: types.LengthUnit[];
  includeUnitsOnly?: types.LengthUnit;
  min?: number | ((unit: string) => number) | undefined;
  max?: number | ((unit: string) => number) | undefined;
  step?: number | ((unit: string) => number) | undefined;
  sx?: SxProps;
  slotSxProps?: {
    slider?: SxProps;
    lengthInput?: SxProps;
  };
}) => {
  const { ref, onChange, sx, enableMouseEvent = true } = props;
  const { value, unit } = parseLengthValue(props.value, {
    defaultUnit: props.includeUnitsOnly,
  });

  const getSliderValue = (
    value: number | ((unit: string) => number) | undefined,
    defaultUnit: number
  ): number => {
    return typeof value === "function" ? value(unit) : (value ?? defaultUnit);
  };

  const [sliderUnit, setSliderUnit] = useState<{
    min: number;
    max: number;
    step: number;
  }>({
    min: getSliderValue(props.min, 0),
    max: getSliderValue(props.max, 100),
    step: getSliderValue(props.step, 1),
  });

  useEffect(() => {
    const min = getSliderValue(props.min, 0);
    const max = getSliderValue(props.max, 100);
    const step = getSliderValue(props.step, 1);

    setSliderUnit({ min, max, step });
  }, [props.min, props.max, props.step, unit]);

  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 0.5,
        ...sx,
      }}
    >
      <Slider
        //disabled={contentItem !== undefined}
        size="small"
        value={
          value === "auto" || unit == "auto" || isNaN(parseFloat(value))
            ? 0
            : parseFloat(value)
        }
        onChange={(e, value) => {
          if (unit === "auto") {
            return;
          }
          onChange(`${value}${unit}`);
        }}
        valueLabelDisplay="auto"
        min={sliderUnit.min}
        max={sliderUnit.max}
        step={sliderUnit.step}
        sx={{
          width: "60%",
          ...props.slotSxProps?.slider,
        }}
      />

      <LengthInput
        size={props.size ?? "small"}
        enableMouseEvent={enableMouseEvent}
        excludeUnits={props.excludeUnits}
        includeUnits={props.includeUnits}
        includeUnitsOnly={props.includeUnitsOnly}
        onChange={(value) => {
          onChange(value);
        }}
        min={sliderUnit.min}
        max={sliderUnit.max}
        value={`${value}${unit}`}
        sx={{
          width: "40%",
          backgroundColor: (theme) => theme.palette.background.paper,
          ...props.slotSxProps?.lengthInput,
        }}
      />
    </Box>
  );
};
