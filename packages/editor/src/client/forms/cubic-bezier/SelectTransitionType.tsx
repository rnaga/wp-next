import { useState } from "react";

import { Autocomplete, AutocompleteValue } from "@mui/material";

import {
  SelectAutocomplete,
  type SlotSxProps,
} from "@rnaga/wp-next-ui/SelectAutocomplete";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const RenderOption = SelectAutocomplete.RenderOption;

type TransitionOption = {
  label: string;
  value: string;
};

const DEFAULT_TRANSITION_OPTIONS: TransitionOption[] = [
  { label: "all", value: "all" },
  { label: "opacity", value: "opacity" },
  { label: "transform", value: "transform" },
  { label: "width", value: "width" },
  { label: "height", value: "height" },
  { label: "background-color", value: "background-color" },
  { label: "color", value: "color" },
  { label: "margin", value: "margin" },
  { label: "padding", value: "padding" },
  { label: "border", value: "border" },
  { label: "border-radius", value: "border-radius" },
  { label: "box-shadow", value: "box-shadow" },
  { label: "filter", value: "filter" },
  { label: "top", value: "top" },
  { label: "left", value: "left" },
  { label: "right", value: "right" },
  { label: "bottom", value: "bottom" },
  { label: "font-size", value: "font-size" },
  { label: "max-height", value: "max-height" },
  { label: "max-width", value: "max-width" },
];

export const SelectTransitionType = (props: {
  onChange: (value: string) => void;
  defaultValue?: string;
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
  options?: TransitionOption[];
}) => {
  const {
    onChange,
    defaultValue = "",
    slotSxProps,
    size,
    options = DEFAULT_TRANSITION_OPTIONS,
  } = props;

  const [value, setValue] = useState<string>(defaultValue);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        size="small"
        freeSolo
        disableClearable
        value={value as AutocompleteValue<string, false, true, true>}
        onChange={(e, v) => {
          const newValue = typeof v === "string" ? v : v;
          handleChange(newValue);
        }}
        onInputChange={(event, newValue, reason) => {
          if (reason === "input" || reason === "clear") {
            handleChange(newValue);
          }
        }}
        getOptionLabel={(option) => {
          return typeof option === "string" ? option : option;
        }}
        options={options.map((opt) => opt.value)}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: slotSxProps?.input,
        })}
        renderOption={(props, option, state) => {
          const optionData = options.find((opt) => opt.value === option);
          return (
            <RenderOption
              key={option}
              props={props}
              option={{
                label: optionData?.label ?? option,
                id: option,
              }}
              state={state}
            />
          );
        }}
      />
    </SelectAutocomplete.Wrapper>
  );
};
