import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, Slider, SxProps } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { WP_BREAKPOINT_WIDTH_CHANGED_COMMAND } from "../../breakpoint/commands";
import { useMouseMove } from "@rnaga/wp-next-ui/hooks/use-mouse-move";
import { Background } from "./Background";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import {
  CSSVariableBadge,
  CSSVariableBadgeContainer,
} from "./CSSVariableBadge";
import {
  CSSVariablesItemContext,
  useCSSVariablesItem,
} from "../../css-variables/CSSVariablesItemContext";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import type * as types from "../../../types";
import { SliderLengthInput } from "./SliderLengthInput";
import { on } from "events";
import { parseLengthValue } from "../../../lexical/styles/length-value";

type Props = {
  keyofUsage: types.KeyOfCSSVariablesUsage;
  //altKeyofUsage?: types.AltKeyOfCSSVariablesUsage[];
  sx: SxProps<any>;
  ref?: React.RefObject<HTMLDivElement | null>;
  direction: "vertical" | "horizontal";
  onDeltaChange: (
    e: MouseEvent,
    delta: { x: number; y: number }
  ) => {
    value: string | null;
    unit: string | null;
  };
  onInputChange: (value: string | undefined) => {
    value: string | null;
    unit: string | null;
  };
  value: string | null;
  min: number | ((unit: string) => number);
  max: number | ((unit: string) => number);
  step: number | ((unit: string) => number);
};

export const StyleMouseInput = (props: Props) => (
  <CSSVariablesItemContext
    keyofUsage={props.keyofUsage}
    //altKeyofUsage={props.altKeyofUsage}
  >
    <Container {...props} />
  </CSSVariablesItemContext>
);

const Container = (props: Props) => {
  const { keyofUsage, sx, direction, onDeltaChange, onInputChange } = props;

  const { wpTheme } = useWPTheme();
  const { contentItems, overrideMode } = useCSSVariablesItem();
  const { item: contentItem } = contentItems?.[0] ?? {};

  const cursor = direction === "vertical" ? "ns-resize" : "ew-resize";
  const [value, setValue] = useState<string | null>(null);
  const [unit, setUnit] = useState<string>("px");

  const [openInputBox, setOpenInputBox] = useState(false);

  const handleDeltaChange = (
    e: MouseEvent,
    delta: {
      x: number;
      y: number;
    }
  ) => {
    const { value, unit } = onDeltaChange(e, delta);
    // Parse and set the value and unit
    const parsed = parseLengthValue(`${value ?? ""}`);
    setValue(parsed.value);
    setUnit(parsed.unit);
  };

  const { initMouseMove } = useMouseMove({
    onDeltaChange: handleDeltaChange,
    cursor,
    threshold: 1,
  });

  const handleOpenInputBox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenInputBox(true);
  };

  const handleInputChange = (value: string | undefined) => {
    if (value === undefined || String(value).trim() === "") {
      setValue(null);
      setUnit("px");
      return;
    }

    const { value: numValue, unit } = onInputChange(value);
    setValue(numValue);
    setUnit(unit ?? "px");
  };

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { value, unit } = parseLengthValue(`${props.value ?? ""}`);

    setValue(value);
    setUnit(unit);
  }, [props.value]);

  if (value === null) {
    return null;
  }

  // Set CSS variables if overrideMode is enabled and the contentItem is set
  const cssVariablesValue =
    !overrideMode && contentItem?.initialValue
      ? contentItem.initialValue
      : undefined;

  return (
    <>
      <InputBox
        ref={props.ref ?? ref}
        keyofUsage={keyofUsage}
        onChange={handleInputChange}
        onClose={() => setOpenInputBox(false)}
        value={`${value}${unit}`}
        open={openInputBox}
        min={props.min}
        max={props.max}
        step={props.step}
      />
      <Box
        ref={ref}
        sx={{
          position: "absolute",
          display: "flex",
          ...sx,
          backgroundColor: (theme) => theme.palette.grey[300],
          cursor: cssVariablesValue ? "not-allowed" : cursor,
        }}
        onMouseDown={cssVariablesValue ? undefined : initMouseMove(ref)}
      >
        <Typography
          sx={{
            alignSelf: "center",
            marginLeft: "auto",
            marginRight: "auto",
            cursor: "default",
            whiteSpace: "pre-wrap",
            textAlign: "center",
            fontSize: 12,
            backgroundColor: (theme) =>
              cssVariablesValue ? wpTheme.badge.backgroundColor : "transparent",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleOpenInputBox(e);
          }}
        >
          {cssVariablesValue ? (
            cssVariablesValue
          ) : (
            <>
              {value} {unit !== "px" ? unit : ""}
            </>
          )}
        </Typography>
      </Box>
    </>
  );
};

const InputBox = (props: {
  ref: RefObject<HTMLDivElement | null>;
  keyofUsage: types.KeyOfCSSVariablesUsage;
  onChange: (value: string | undefined) => void;
  onClose: () => void;
  value: string;
  //unit: string;
  open: boolean;
  min: number | ((unit: string) => number);
  max: number | ((unit: string) => number);
  step: number | ((unit: string) => number);
}) => {
  const { ref, keyofUsage, onChange, onClose, value, open, min, max, step } =
    props;
  const { wpHooks } = useWP();

  const [boxOffset, setBoxOffset] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>();

  const updateOffset = useCallback(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    setBoxOffset({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [ref.current]);

  useEffect(() => {
    updateOffset();
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_WIDTH_CHANGED_COMMAND,
      () => {
        updateOffset();
      }
    );
  }, [ref.current, open]);

  if (!open || !boxOffset) {
    return null;
  }

  return (
    <>
      <Background zIndex={999} onClose={onClose} />
      <Box
        sx={{
          position: "fixed",
          display: open ? "block flex" : "none",
          top: boxOffset.top + boxOffset.height / 3,
          left: boxOffset.left,
          width: boxOffset.width,
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          p: 1,
          justifyContent: "center",
          gap: 1,
        }}
      >
        <CSSVariableBadgeContainer
          keyofUsage={keyofUsage}
          syntax={["length"]}
          sx={{
            width: "100%",
          }}
          slotSxProps={{
            valueBox: {
              width: "80%",
              textAlign: "center",
            },
            iconBox: {
              right: "auto",
              left: "50%",
              transform: "translateX(-50%)",
              gap: 1,
            },
          }}
        >
          <SliderLengthInput
            onChange={(newValue) => {
              if (newValue === "auto") {
                onChange("auto");
                return;
              }

              // Validate the input value and default to "0px" if empty or invalid
              // This ensures the CSS property always has a valid numeric length value
              const parsed = parseLengthValue(newValue || "");
              if (parsed.value === "" || isNaN(Number(parsed.value))) {
                onChange("0px");
                return;
              }

              onChange(newValue);
            }}
            value={value}
            min={min}
            max={max}
            step={step}
          />
        </CSSVariableBadgeContainer>
      </Box>
    </>
  );
};
