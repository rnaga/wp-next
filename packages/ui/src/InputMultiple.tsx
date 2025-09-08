"use client";

import { Autocomplete, SxProps } from "@mui/material";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";
import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { Typography } from "./Typography";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;

export type InputMultipleItem = string;

export const InputMultiple = (props: {
  value?: InputMultipleItem[];
  onChange: (
    values: InputMultipleItem[],
    e: SyntheticEvent<Element, Event>
  ) => void;
  validate?: (value: string) => [true] | [false, string];
  freeSolo?: boolean;
  slotSxProps?: SlotSxProps;
  size?: "small" | "medium";
  limitTags?: number;
  sx?: SxProps;
}) => {
  const {
    onChange,
    validate,
    freeSolo = true,
    slotSxProps,
    size,
    limitTags = 2,
    sx,
  } = props;
  const [value, setValue] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  // Filter out empty strings from the value array
  // const value = useMemo(
  //   () => (props.value ?? []).filter((v) => `${v}`.trim() !== ""),
  //   [props.value]
  // );

  const items = useMemo(
    () =>
      (value ?? []).map((item: InputMultipleItem) =>
        typeof item === "string" ? { label: item, id: item } : item
      ),
    [value]
  );

  useEffect(() => {
    const newValue = (props.value ?? []).filter((v) => `${v}`.trim() !== "");
    setValue(newValue);
  }, [props.value]);

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        size="small"
        multiple
        freeSolo
        limitTags={limitTags}
        options={items}
        value={value}
        onChange={(event, value) => {
          event.stopPropagation();

          if (validate) {
            for (const item of value) {
              if (typeof item !== "string") {
                continue;
              }
              const [success, errorMessage] = validate(item);
              if (!success) {
                // If validation fails, do not update the value
                setError(errorMessage);
                return;
              }
            }
          }

          const newValue = value.map((item) =>
            typeof item === "string" ? item : item.id
          );
          setError(undefined);
          setValue(newValue);
          onChange(newValue, event);
        }}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: { zIndex: 9999, ...slotSxProps?.input },
          ...sx,
        })}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        slotProps={{
          // Don't show the dropdown menu
          popper: {
            sx: {
              display: "none",
            },
          },
        }}
      />
      {error && (
        <Typography size={size} color="error">
          {error}
        </Typography>
      )}
    </SelectAutocomplete.Wrapper>
  );
};
