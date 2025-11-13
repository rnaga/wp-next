import {
  Autocomplete,
  AutocompleteRenderInputParams,
  fabClasses,
  Input,
  ListItem,
  SxProps,
  TextField,
} from "@mui/material";
import React, {
  createContext,
  HTMLAttributes,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Typography } from "./Typography";

type Item = {
  label: string;
  value: string | number;
};

export type SlotSxProps = {
  input?: SxProps;
  textField?: SxProps;
  popper?: SxProps;
  chip?: SxProps;
  options?: SxProps;
};

const Context = createContext<{
  item: Item;
  setItem: (item: Item) => void;
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
}>({} as any);

const sxSelectAutocomplete = (props: {
  size: "small" | "medium";
  sx?: SxProps;
}) => {
  const { size, sx } = props;
  return {
    p: "0.5px !important",
    "& .MuiOutlinedInput-root": {
      py: "0 !important",
      fontSize: size == "medium" ? 14 : 12,
      px: 1,
      ...((sx ?? {}) as any),
    },
    "& .MuiInputBase-input": {
      cursor: "pointer",
      height: size == "medium" ? 24 : 16,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "& .MuiOutlinedInput-root .MuiAutocomplete-input": {
      py: size == "medium" ? 0.5 : 0.3,
    },
    "& .MuiAutocomplete-tag": {
      fontSize: size == "medium" ? 11 : 10,
    },
    //height: size == "medium" ? 32 : 24,
    ...sx,
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
        fontSize: size == "medium" ? 14 : 12,
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

const RenderOption = <
  T extends {
    label: string;
    id: string;
  }
>(_props: {
  props: HTMLAttributes<HTMLLIElement> & {
    key: any;
  };
  option: T;
  state: { selected: boolean };
  onChange?: (
    value: string,
    item: { label: string; value: string | number }
  ) => void;
  onBlur?: (
    value: string,
    item: { label: string; value: string | number }
  ) => void;
}) => {
  const { props, option, state, onChange, onBlur } = _props;

  const { setItem, size, slotSxProps } = useContext(Context);

  if (state.selected) {
    return null;
  }

  return (
    <ListItem
      {...props}
      key={option.id}
      onClick={(e) => {
        const item = {
          label: option.label,
          value: option.id,
        };
        onChange && onChange(`${item.value}`, item);
        setItem(item);

        // delegate to the original onClick
        props?.onClick && props.onClick(e);
      }}
      onBlur={(e) => {
        onBlur &&
          onBlur(`${option.id}`, { label: option.label, value: option.id });

        // delegate to the original onBlur
        props?.onBlur && props.onBlur(e);
      }}
    >
      <Typography
        size={size}
        sx={{
          ...slotSxProps?.options,
        }}
      >
        {option.label}
      </Typography>
    </ListItem>
  );
};

type AutocompleteParameters = Parameters<
  typeof Autocomplete<{
    label: string;
    id: string;
  }>
>[0];

const Wrapper = (props: {
  slotSxProps?: SlotSxProps;
  size?: "small" | "medium";
  children: React.ReactNode;
}) => {
  const [item, setItem] = useState<Item>();
  const { slotSxProps, size } = props;

  return (
    <Context value={{ item, setItem, size, slotSxProps }}>
      {props.children}
    </Context>
  );
};

export const SelectAutocomplete = (
  props: {
    onChange: (value: string, item: Item) => void;
    onBlur?: (value: string, item: Item) => void;
    size?: "small" | "medium";
    slotProps?: {
      input?: SxProps;
      textField?: SxProps;
      popper?: SxProps;
      options?: SxProps;
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
    sx,
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
    <Wrapper {...props}>
      <Autocomplete
        size="small"
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
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: slotProps?.input,
        })}
        renderOption={(props, option, state) => {
          return (
            <RenderOption
              key={option.id}
              props={props}
              option={option}
              state={state}
              onChange={onChange}
              onBlur={onBlur}
            />
          );
        }}
        disableClearable={
          (disableClearable === true
            ? true
            : value == null
            ? true
            : false) as any
        }
        slotProps={slotProps}
        {...rest}
      />
    </Wrapper>
  );
};

SelectAutocomplete.sx = sxSelectAutocomplete;
SelectAutocomplete.TextField = SelectAutocompleteTextField;
SelectAutocomplete.RenderOption = RenderOption;
SelectAutocomplete.Wrapper = Wrapper;
