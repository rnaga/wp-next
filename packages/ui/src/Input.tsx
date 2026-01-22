import { Box, IconButton, Input as MuiInput } from "@mui/material";
import { useEffect, useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { useColorScheme as useMaterialColorScheme } from "@mui/material/styles";

export const Input = (
  props: {
    onChange?: (value: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (value: string) => void;
    onClear?: () => void | Promise<void>;
    canClear?: boolean;
    value?: string | number;
    size?: "small" | "medium" | "large";
    disableBorder?: boolean;
    clearable?: boolean;
    readOnly?: boolean;
    removeBorderOnFocus?: boolean;
    isEmpty?: boolean;
  } & Omit<
    Parameters<typeof MuiInput>[0],
    "onChange" | "value" | "onBlur" | "size" | "readOnly"
  >
) => {
  const {
    onChange,
    onBlur,
    onClear,
    canClear,
    size,
    disableBorder,
    sx,
    readOnly = false,
    clearable = false,
    removeBorderOnFocus = false,
    multiline,
    value: _value,
    isEmpty,
    ...rest
  } = props;

  const [value, setValue] = useState<string | number | undefined>(_value ?? "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);
    onChange && onChange(value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!onBlur) return;

    setValue(value);
    onBlur(value);
  };

  const handleClear = () => {
    setValue("");
    onClear && onClear();
  };

  useEffect(() => {
    if (_value === undefined || _value === null || "" == _value) return;
    setValue(_value);
  }, [_value]);

  useEffect(() => {
    if (isEmpty === true) {
      setValue("");
    }
  }, [isEmpty]);

  return (
    <MuiInput
      disableUnderline
      readOnly={readOnly}
      onBlur={handleBlur}
      value={value}
      onChange={handleChange}
      multiline={multiline}
      // onFocus={(e) => e.target.select?.()}
      sx={{
        height: multiline
          ? "auto"
          : size === "large"
            ? 36
            : size == "medium"
              ? 32
              : 24,
        px: 1,
        fontSize: size === "large" ? 16 : size == "medium" ? 14 : 12,
        border:
          disableBorder || multiline
            ? undefined
            : (theme) => `1px solid ${theme.palette.grey[400]}`,
        borderRadius: 1,
        "&:focus-within": removeBorderOnFocus
          ? {
              border: "none",
              borderColor: "transparent",
            }
          : {
              // border: (theme) => `1px solid ${theme.palette.primary.main}`,
              // borderColor: (theme) => theme.palette.primary.main,
            },
        "&.MuiInputBase-root": {
          mt: 0,
          ...(multiline && {
            p: 0,
          }),
        },
        backgroundColor: readOnly ? "#f5f5f5" : "transparent",
        color: (theme) => theme.palette.text.primary,

        ...sx,
      }}
      slotProps={{
        input:
          !disableBorder && multiline
            ? {
                sx: {
                  border: (theme) => `1px solid ${theme.palette.grey[400]}`,
                  p: 1,
                  borderRadius: 1,
                },
              }
            : undefined,
      }}
      endAdornment={
        ((clearable && String(`${value}`).length > 0) || canClear === true) && (
          <Box
            sx={{
              width: 20,
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              sx={{
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
      {...rest}
    />
  );
};
