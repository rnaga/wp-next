import { Autocomplete, ListItem, SxProps } from "@mui/material";
import { useMemo, useState } from "react";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";
import { Typography } from "./Typography";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const Wrapper = SelectAutocomplete.Wrapper;

type Item = {
  label: string;
  value: string | number;
};

export const SelectFreeSoloAutocomplete = (props: {
  onChange: (value: string, item: Item) => void;
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
  items: Item[];
  value?: string;
  sx?: SxProps;
}) => {
  const { onChange, size, items, value, slotSxProps, sx } = props;

  const [inputValue, setInputValue] = useState("");

  const currentValue = useMemo(() => {
    if (!value) {
      return undefined;
    }
    const item = items.find((item) => item.value == value);

    return item
      ? { label: item.label, id: `${item.value}` }
      : { label: `${value}`, id: `${value}` };
  }, [value, items]);

  return (
    <Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        size="small"
        freeSolo
        value={currentValue ?? { label: "", id: "" }}
        inputValue={inputValue !== "" ? inputValue : currentValue?.label ?? ""}
        options={items.map((item) => ({
          label: item.label,
          id: `${item.value}`,
        }))}
        onInputChange={(_, newInputValue, reason) => {
          if (reason === "input") {
            setInputValue(newInputValue);
          } else {
            setInputValue("");
          }
        }}
        onChange={(_, newValue, reason) => {
          if (reason === "createOption" && typeof newValue === "string") {
            const item: Item = { label: newValue, value: newValue };
            onChange(newValue, item);
            setInputValue("");
          } else if (
            reason === "selectOption" &&
            typeof newValue === "object" &&
            newValue !== null
          ) {
            const item: Item = {
              label: newValue.label,
              value: newValue.id,
            };
            onChange(newValue.id, item);
            setInputValue("");
          }
        }}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }
          return option.label;
        }}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: slotSxProps?.input ?? sx,
        })}
        renderOption={(props, option, state) => {
          const { key, ...restProps } = props;

          if (state.selected) {
            return null;
          }

          return (
            <ListItem
              key={key}
              {...restProps}
              onClick={(e) => {
                const item: Item = {
                  label: option.label,
                  value: option.id,
                };
                onChange(option.id, item);
                setInputValue("");
                restProps?.onClick && restProps.onClick(e);
              }}
            >
              <Typography
                size={size}
                sx={slotSxProps?.options}
              >
                {option.label}
              </Typography>
            </ListItem>
          );
        }}
        disableClearable
      />
    </Wrapper>
  );
};
