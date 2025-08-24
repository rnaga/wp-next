import { SxProps } from "@mui/material";

import { BasicMenuButton, BasicMenuButtonItem } from "./BasicMenuButton";
import { Input } from "./Input";

export const Select = (props: {
  enum:
    | {
        label: string;
        value: any;
      }[]
    | undefined;
  onChange: (value: string, item: BasicMenuButtonItem) => void;
  label?: string;
  size?: "small" | "medium";
  value?: any;
  readOnly?: boolean;
  sx?: SxProps;
  slotProps?: {
    readOnlyInput?: {
      sx?: SxProps;
    };
  };
  disabled?: boolean;
}) => {
  const { onChange, size, value, sx, slotProps, disabled = false } = props;

  if (props.readOnly) {
    return (
      <Input
        size={size}
        value={props.value}
        readOnly={true}
        sx={{
          width: "100%",
          ...slotProps?.readOnlyInput?.sx,
        }}
      />
    );
  }

  const label =
    props.label ?? props.enum?.find((item) => item.value === value)?.label;

  return (
    <BasicMenuButton
      items={props.enum ?? []}
      disabled={disabled}
      size={size}
      onChange={(value, item) => {
        //setValue(item);
        onChange(value, item);
      }}
      label={
        label ?? props.enum?.find((item) => item.value === value)?.label ?? ""
      }
      value={value}
      sx={{
        width: "100%",
        border: "1px solid",
        borderColor: "grey.400",
        justifyContent: "space-between",
        ...sx,
      }}
    />
  );
};
