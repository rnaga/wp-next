import { useState } from "react";

import { DataInputEndDecorator } from "./DataInputEndDecorator";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Box, SxProps } from "@mui/material";

export const DataInput = (props: {
  onChange: (value: string, index?: number) => void;
  onBlur?: (keyValue: Record<string, any>) => void;
  name: string;
  value: string;
  size?: "small" | "medium";
  readOnly?: boolean;
  sx?: SxProps;
  slotProps?: {
    input?: SxProps;
  };
}) => {
  const { onChange, onBlur, size = "small", readOnly, name } = props;

  const [value, setValue] = useState(props.value);

  const handleClick = (dataValue: string, index?: number) => {
    const newValue = value ? `${value} \${${dataValue}}` : `\${${dataValue}}`;
    setValue(newValue);
    onChange(newValue, index);
  };

  const handleChange = (value: string) => {
    setValue(value);
    onChange(value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        ...props.sx,
      }}
    >
      <Input
        onBlur={(value) => {
          onBlur && onBlur({ [name]: value });
        }}
        readOnly={readOnly}
        size={size}
        fullWidth
        value={value}
        onChange={handleChange}
        sx={{
          ...props.slotProps?.input,
        }}
      />

      <DataInputEndDecorator onClick={handleClick} />
    </Box>
  );
};
