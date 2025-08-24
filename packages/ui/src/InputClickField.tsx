import { SxProps } from "@mui/material";
import { Input } from "./Input";

export const InputClickField = (
  props: {
    label: string;
    value?: string;
    onClick: (e: MouseEvent) => void;
    size?: "small" | "medium" | "large";
    sx?: SxProps;
    slotSxProps?: {
      input?: SxProps;
    };
  } & Omit<
    Parameters<typeof Input>[0],
    "label" | "size" | "onClick" | "readOnly"
  >
) => {
  const { label, onClick, size, value, ...rest } = props;
  return (
    <Input
      readOnly
      placeholder={label}
      onClick={(e) => {
        onClick(e as unknown as MouseEvent);
      }}
      slotProps={{
        input: {
          sx: {
            py: 0.1,
            "::placeholder": {
              fontSize: size === "large" ? 16 : size === "medium" ? 14 : 12,
              opacity: value ? 0.8 : 0.5,
            },
            ...props.slotSxProps?.input,
          },
        },
      }}
      sx={{
        ...props.sx,
      }}
      {...rest}
    />
  );
};
