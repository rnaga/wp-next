import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Divider,
  Input,
  Menu,
  MenuItem,
  SxProps,
  Theme,
} from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { parseLengthValue } from "../../../lexical/styles/length-value";
import { trackEventEnd } from "../../event-utils";

import type * as types from "../../../types";

type Item = {
  label: string;
  value: types.LengthUnit;
};

const MenuButton = (props: {
  items: Item[];
  unit: types.LengthUnit;
  readOnly?: boolean;
  onSelect: (item: string) => void;
  size: "small" | "medium";
}) => {
  const { items, onSelect, unit, size, readOnly } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { wpTheme } = useWPTheme();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleClick(e);
        }}
        sx={{
          textTransform: "none",
          fontSize: size == "medium" ? 14 : 12,
          py: 0,
          px: 1,
          mx: 0,
          minWidth: "unset",
          color: wpTheme.colorScale[900],
          backgroundColor: wpTheme.colorScale[100],
          opacity: 0.6,
        }}
        disabled={readOnly}
      >
        {unit}
      </Button>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={(e: any) => {
          e.stopPropagation();
          handleClose();
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: 200,
            },
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.value}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.value);
              handleClose();
            }}
            sx={{
              mx: size === "medium" ? 2 : 1,
              my: size === "medium" ? 1 : 0.5,
              p: 0,
            }}
          >
            <Typography fontSize={size == "medium" ? 14 : 12}>
              {item.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export const LengthInput = (props: {
  onChange?: (value: string | undefined) => void;
  onBlur?: (value: string) => void;
  readOnly?: boolean;
  size?: "small" | "medium";
  value: string | number | undefined | null;
  min?: number;
  max?: number;
  sx?: SxProps<Theme>;
  enableMouseEvent?: boolean;
  excludeUnits?: types.LengthUnit[];
  includeUnits?: types.LengthUnit[];
  includeUnitsOnly?: types.LengthUnit;
}) => {
  const {
    onBlur,
    onChange,
    readOnly = false,
    sx,
    min = 0,
    max,
    enableMouseEvent,
    includeUnits,
    includeUnitsOnly,
    size = "medium",
  } = props;
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dont include "deg" or "ms" in excludeUnits if includeUnits have them
  const specialUnits: types.LengthUnit[] = ["deg", "ms"];

  // If includeUnitsOnly is set, use it; otherwise use the excludeUnits logic
  const excludeUnits = includeUnitsOnly
    ? undefined
    : specialUnits.some((unit) => includeUnits?.includes(unit))
      ? (props.excludeUnits ?? [])
      : [
          ...(props.excludeUnits ?? []),
          ...specialUnits.filter((unit) => !includeUnits?.includes(unit)),
        ];

  const items = [
    { label: "px", value: "px" },
    { label: "%", value: "%" },
    { label: "em", value: "em" },
    { label: "rem", value: "rem" },
    { label: "auto", value: "auto" },
    { label: "deg", value: "deg" },
    { label: "ms", value: "ms" },
  ]
    .filter(
      (item) =>
        includeUnitsOnly === undefined || item.value === includeUnitsOnly
    )
    .filter((item) => !excludeUnits?.includes(item.value as types.LengthUnit))
    .filter(
      (item) =>
        includeUnits === undefined ||
        includeUnits?.includes(item.value as types.LengthUnit)
    ) as Item[];

  const defaultUnit = includeUnitsOnly || items[0]?.value || "px";

  const [valueUnit, setValueUnit] = useState<{
    value: string | null;
    unit: string;
  }>({ value: "", unit: defaultUnit });

  const { value, unit } = useMemo(() => valueUnit, [valueUnit]);

  const isValidValue = useMemo(() => {
    if (value === "auto") {
      return true;
    }

    const numValue = Number(value);
    return value !== "" && !isNaN(numValue);
  }, [value]);

  const handleChange = (value: string | undefined, unit: string) => {
    if (!onChange) return;

    if (value === undefined || value.length === 0) {
      onChange(undefined);
      // Reset internal state to default when input is cleared to ensure the input box
      // displays the placeholder and unit selector shows the default unit
      setValueUnit({ value: null, unit: defaultUnit });
      return;
    }

    onChange(`${value}${unit}`);

    setValueUnit({ value: value ?? null, unit });
  };

  // handleMouseDown is used to handle mouse move event
  // which is used to change the value of the input when the user moves the mouse
  // also it is used to handle the overlay to prevent the input from losing focus
  const handleMouseDown = (e: React.MouseEvent) => {
    const overlay = overlayRef.current;
    const startValue = Number(value);

    if (overlay === null || !isValidValue) {
      return;
    }

    //e.preventDefault();
    //e.stopPropagation();

    const startY = e.clientY;
    const startUnit = unit;

    const mouseMoveHandler = (e: MouseEvent) => {
      trackEventEnd(
        "length-input",
        () => {
          const diff = e.clientY - startY;
          let newValue = startValue + diff;

          // Check if max value is defined and newValue is greater than max value,
          // or if min value is defined and newValue is less than min value
          newValue = max !== undefined ? Math.min(max, newValue) : newValue;
          newValue = min !== undefined ? Math.max(min, newValue) : newValue;

          handleChange(`${newValue}`, startUnit);
        },
        10
      );
    };

    const mouseUpHandler = () => {
      if (overlay === null) {
        return;
      }
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      overlay.style.display = "none";
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
    overlay.style.display = "block";
  };

  useEffect(() => {
    const parsed = parseLengthValue(`${props.value ?? ""}`, {
      defaultUnit: defaultUnit as types.LengthUnit,
    });
    // If includeUnitsOnly is set, force the unit to be that specific unit
    const unit = includeUnitsOnly || parsed.unit;
    setValueUnit({ value: parsed.value, unit });
  }, [props.value, defaultUnit, includeUnitsOnly]);

  useEffect(() => {
    // Fix MenuButton display when switching from "auto" to a numeric unit.
    // When value is "auto", unit is empty (""). After switching to a numeric unit,
    // the unit should default to the first available unit (e.g., "px") to ensure
    // the MenuButton shows the correct unit label.
    if (value !== "auto" && String(unit).length === 0) {
      setValueUnit({ value, unit: defaultUnit });
    }
  }, [value, unit]);

  return (
    <>
      {enableMouseEvent && (
        <Box
          ref={overlayRef}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "none",
            opacity: "0.5",
            zIndex: 1001,
            cursor: "ns-resize",
          }}
        />
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          border: (theme) => `1px solid ${theme.palette.grey[400]}`,
          borderRadius: 1,
          "&:focus-within": {
            borderColor: (theme) => theme.palette.primary.main,
          },
          width: "100%",
          ...sx,
        }}
      >
        <Input
          disableUnderline
          readOnly={readOnly}
          ref={inputRef}
          onBlur={(e) => {
            if (!onBlur) return;

            unit === "auto"
              ? onBlur("auto")
              : onBlur(`${e.target.value}${unit}`);
          }}
          type="string"
          value={value ?? " "}
          onChange={(e) => {
            if (unit === "auto") {
              return;
            }

            // Don't call handleChange if onBlur is defined
            !onBlur && handleChange(e.target.value, unit);
          }}
          onFocus={(e) => e.target.select?.()}
          sx={{
            pl: 1,
            //backgroundColor: theme => theme.palette.background.paper,
            fontSize: size === "medium" ? 14 : 12,
            height: size === "medium" ? 32 : 24,
            flex: 1,
            flexGrow: 1,
          }}
          slotProps={{
            input: {
              sx: {
                cursor:
                  isValidValue && enableMouseEvent ? "ns-resize" : "inherit",
              },
              onMouseDown: enableMouseEvent ? handleMouseDown : undefined,
            },
          }}
          // passing the rest of the props to the input
          //{...rest}
        />
        <Divider sx={{ minHeight: 15, m: 0.5 }} orientation="vertical" />
        <MenuButton
          size={size}
          items={items}
          unit={unit as types.LengthUnit}
          readOnly={readOnly}
          onSelect={(item) => {
            if (item === "auto") {
              handleChange("auto", "");
              return;
            }

            const newUnit =
              item ?? includeUnitsOnly ?? includeUnits?.[0] ?? "px";
            handleChange(value ?? undefined, newUnit);
          }}
        />
      </Box>
    </>
  );
};
