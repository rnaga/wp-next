import { Box } from "@mui/material";
import { Textarea } from "@rnaga/wp-next-ui/Textarea";
import { DataInputEndDecorator } from "./DataInputEndDecorator";

export const TextareaDataInput = (props: Parameters<typeof Textarea>[0]) => {
  const { value, onChange, ...rest } = props;

  const handleChange = (value: string) => {
    onChange && onChange(value);
  };

  const handleClick = (dataValue: string, index?: number) => {
    const newValue = value ? `${value} \${${dataValue}}` : `\${${dataValue}}`;
    onChange && onChange(newValue);
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
        }}
      >
        <Textarea value={value} onChange={handleChange} {...rest} />
        <Box
          sx={{
            position: "absolute",
            right: 10,
            bottom: 12,
          }}
        >
          <DataInputEndDecorator onClick={handleClick} />
        </Box>
      </Box>
    </>
  );
};
