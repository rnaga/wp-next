"use client";

import { Autocomplete } from "@mui/material";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";
import { SyntheticEvent, useMemo } from "react";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const RenderOption = SelectAutocomplete.RenderOption;

export type SelectMultipleItem = {
  label: string;
  id: string;
};

export const SelectMultiple = (props: {
  items: SelectMultipleItem[];
  value?: SelectMultipleItem[] | string[];
  onChange: (
    values: SelectMultipleItem[],
    e: SyntheticEvent<Element, Event>
  ) => void;
  freeSolo?: boolean;
  slotSxProps?: SlotSxProps;
  size?: "small" | "medium";
  limitTags?: number;
}) => {
  const {
    items,
    onChange,
    freeSolo = true,
    slotSxProps,
    size,
    limitTags = 2,
  } = props;

  const value = useMemo(
    () =>
      (props.value ?? []).map((item: string | SelectMultipleItem) =>
        typeof item === "string" ? { label: item, id: item } : item
      ),
    [props.value]
  );

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        size="small"
        multiple
        limitTags={limitTags}
        options={items.map((item) => ({
          label: item.label,
          id: `${item.id}`,
        }))}
        value={value}
        onChange={(event, value) => {
          onChange(value, event);
        }}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: { ...slotSxProps?.input },
        })}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        renderOption={(props, option, state) => {
          const id = typeof option === "string" ? option : option.id;
          const label = typeof option === "string" ? option : option.label;

          return (
            <RenderOption
              key={id}
              props={props}
              option={{
                id,
                label,
              }}
              state={state}
            />
          );
        }}
      />
    </SelectAutocomplete.Wrapper>
  );
};
