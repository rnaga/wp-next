import { SxProps, Theme } from "@mui/material";
import { LengthInput } from "./LengthInput";
import { CSSVariableBadge } from "./CSSVariableBadge";
import { StyleLengthInput } from "./StyleLengthInput";

type Props = Parameters<typeof StyleLengthInput>[0] &
  Omit<Parameters<typeof CSSVariableBadge>[0], "children">;

export const StyleLengthInputWithCSSVariable = (props: Props) => {
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
    <CSSVariableBadge keyofUsage={props.keyofUsage} syntax={props.syntax}>
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
    </CSSVariableBadge>
  );
};
