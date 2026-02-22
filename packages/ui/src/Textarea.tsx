import { TextareaAutosize, useTheme } from "@mui/material";

export const Textarea = (
  props: {
    value: string;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    style?: React.CSSProperties;
  } & Omit<
    Parameters<typeof TextareaAutosize>[0],
    "onChange" | "value" | "onBlur"
  >
) => {
  const { value, onChange, onBlur, style, ...rest } = props;
  const theme = useTheme();

  const styleBorder = `1px solid ${theme.palette.grey[400]}`;
  const styleBorderFocus = `1px solid ${theme.palette.primary.main}`;

  const handleChange = (value: string) => {
    onChange && onChange(value);
  };

  const handleBlur = (value: string) => {
    onBlur && onBlur(value);
  };

  return (
    <TextareaAutosize
      minRows={3}
      style={{
        border: styleBorder,
        borderRadius: 4,
        outline: "none",
        width: "100%",
        maxWidth: "100%",
        ...style,
      }}
      value={value}
      onFocus={(e) => {
        e.target.style.border = styleBorderFocus;
      }}
      onBlur={(e) => {
        e.target.style.border = styleBorder;
        handleBlur(value);
      }}
      onChange={(e) => {
        const value = e.target.value;
        handleChange(value);
      }}
      {...rest}
    />
  );
};
