import { SxProps, Theme } from "@mui/material";
import { LengthInput } from "./LengthInput";
import * as types from "../../../types";

export const StyleLengthInput = (props: {
  onChange: (value: string | undefined) => void;
  outOfRange?: boolean;
  value: string | number | undefined | null;
  min?: number;
  max?: number;
  width?: number | string;
  sx?: SxProps<any>;
  excludeUnits?: types.LengthUnit[];
  includeUnits?: types.LengthUnit[];
}) => {
  const {
    onChange,
    outOfRange,
    value,
    width = "100%",
    min,
    max,
    sx,
    excludeUnits,
    includeUnits,
  } = props;
  const { backgroundColor = "transparent", ...restSx } = (sx as any) || {};

  return (
    <LengthInput
      size="small"
      enableMouseEvent
      onChange={onChange}
      min={min}
      max={max}
      value={value ?? ""}
      excludeUnits={excludeUnits}
      includeUnits={includeUnits}
      sx={{
        backgroundColor: outOfRange
          ? (theme) => theme.palette.error.light
          : backgroundColor,
        width,
        ...restSx,
      }}
    />
  );
};
