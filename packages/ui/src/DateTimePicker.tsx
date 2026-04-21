import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useWPTheme } from "./ThemeRegistry";

export const DateTimePicker = (props: {
  value?: string | Date;
  onChange?: (value: string | Date) => void;
  size?: "small" | "medium" | "large";
}) => {
  const { value, onChange, size } = props;
  const { wpTheme } = useWPTheme();

  const fontSize = size === "large" ? 16 : size === "medium" ? 14 : 12;
  const height = size === "large" ? 36 : size === "medium" ? 32 : 24;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDateTimePicker
        /**
         * Pass null for empty/invalid values — dayjs(undefined) returns "now"
         * which misleads the picker when no date has been set.
         */
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          onChange && onChange(newValue?.toDate() || "");
        }}
        slotProps={{
          /**
           * In MUI X v9 the textField slot was removed; use field.sx instead.
           * Targets MuiPickersOutlinedInput-root (replaces MuiOutlinedInput-root).
           */
          field: {
            sx: {
              fontSize,
              height,
              border: `1px solid ${wpTheme.border.color}`,
              borderRadius: 1,
              "& .MuiPickersOutlinedInput-root": {
                height: "100%",
                fontSize,
                "& fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
              },
              "& .MuiPickersSectionList-root": {
                py: 0,
                px: 1,
              },
              "& .MuiSvgIcon-root": {
                fontSize: size === "large" ? 26 : size === "medium" ? 22 : 18,
              },
            },
          } as any,
        }}
        sx={{ width: "100%" }}
      />
    </LocalizationProvider>
  );
};
