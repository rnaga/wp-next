import {
  Autocomplete,
  AutocompleteRenderInputParams,
  fabClasses,
  Input,
  ListItem,
  SxProps,
  TextField,
} from "@mui/material";
import { HTMLInputTypeAttribute, useMemo, useRef, useState } from "react";
import { Typography } from "@rnaga/wp-next-ui/Typography";

type Item = {
  label: string;
  value: string | number;
};

const sxSelectAutocomplete = (props: {
  size: "small" | "medium";
  sx?: SxProps;
}) => {
  const { size, sx } = props;
  return {
    p: "0.5px !important",
    "& .MuiOutlinedInput-root": {
      p: "0 !important",
      fontSize: size == "medium" ? 14 : 12,
      ...((sx ?? {}) as any),
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "& .MuiOutlinedInput-root .MuiAutocomplete-input": {
      py: size == "medium" ? 0.5 : 0.1,
    },
    height: size == "medium" ? 32 : 24,
  };
};

const SelectAutocompleteTextField = (props: {
  size?: "small" | "medium";
  sx?: SxProps;
  params: AutocompleteRenderInputParams;
}) => {
  const { size, sx, params } = props;

  return (
    <TextField
      {...params}
      size={size}
      sx={{
        fontSize: size == "medium" ? 12 : 12,
        border: (theme) => `1px solid ${theme.palette.grey[400]}`,
        borderRadius: 1,
        "&:focus-within": {
          borderColor: (theme) => theme.palette.primary.main,
        },
        ...sx,
      }}
    />
  );
};

type AutocompleteParameters = Parameters<
  typeof Autocomplete<{
    label: string;
    id: string;
  }>
>[0];

export const SelectAutocomplete = (
  props: {
    onChange: (value: string, item: Item) => void;
    onBlur?: (value: string, item: Item) => void;
    size?: "small" | "medium";
    slotProps?: {
      input?: SxProps;
      textField?: SxProps;
      popper?: SxProps;
    } & AutocompleteParameters["slotProps"];
    items: {
      label: string;
      value: string | number;
    }[];

    value?: string;
    disableClearable?: boolean;
  } & Omit<
    AutocompleteParameters,
    | "onChange"
    | "value"
    | "onBlur"
    | "size"
    | "renderInput"
    | "options"
    | "disableClearable"
    | "freeSolo"
  >
) => {
  const {
    slotProps,
    items,
    onChange,
    onBlur,
    size,
    value,
    disableClearable,
    ...rest
  } = props;
  const [item, setItem] = useState<Item>();

  const currentValue = useMemo(() => {
    if (!props.value) {
      return undefined;
    }
    const item = items.find((item) => item.value == props.value);

    return !item
      ? undefined
      : {
          label: item.label,
          id: `${item.value}`,
        };
  }, [value, items]);

  return (
    <Autocomplete
      size="small"
      // multiple
      //freeSolo={true as any}
      value={
        currentValue ?? {
          label: "",
          id: "",
        }
      }
      options={items.map((item) => ({
        label: item.label,
        id: `${item.value}`,
      }))}
      onBlur={() => {
        onBlur && item && onBlur(`${item.value}`, item);
      }}
      renderInput={(params) => (
        <SelectAutocompleteTextField
          params={params}
          size={size}
          sx={slotProps?.textField}
        />
      )}
      sx={sxSelectAutocomplete({ size: size ?? "small", sx: slotProps?.input })}
      renderOption={(props, option, state) => {
        return state.selected ? null : (
          <ListItem
            {...props}
            key={option.id}
            onClick={(e) => {
              const item: Item = {
                label: option.label,
                value: option.id,
              };
              onChange(`${item.value}`, item);
              setItem(item);

              // delegate to the original onClick
              props?.onClick && props.onClick(e);
            }}
            onBlur={(e) => {
              onBlur && item && onBlur(`${item.value}`, item);

              // delegate to the original onBlur
              props?.onBlur && props.onBlur(e);
            }}
          >
            <Typography size={size}>{option.label}</Typography>
          </ListItem>
        );
      }}
      disableClearable={(disableClearable ? value == null : false) as any}
      slotProps={slotProps}
      {...rest}
    />
  );
};

SelectAutocomplete.sx = sxSelectAutocomplete;
SelectAutocomplete.TextField = SelectAutocompleteTextField;
