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
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDateTimePicker
        value={dayjs(value)}
        onChange={(newValue) => {
          onChange && onChange(newValue?.toDate() || "");
        }}
        slotProps={{
          textField: {
            size: "small",
            slotProps: {
              input: { disableUnderline: true, sx: { fontSize: 0.1 } },
            },

            sx: {
              "& .MuiInputBase-input": {
                py: 0.5,
                px: 1,
              },
              "& .MuiOutlinedInput-root": {
                fontSize: size === "large" ? 16 : size === "medium" ? 14 : 12,
                height: size === "large" ? 36 : size == "medium" ? 32 : 24,

                border: `1px solid ${wpTheme.border.color}`,
                "& fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
              },
              "& .MuiSvgIcon-root": {
                fontSize: size === "large" ? 26 : size === "medium" ? 22 : 18,
              },
            },
          },
        }}
        sx={{
          width: "100%",
        }}
      />
    </LocalizationProvider>
  );
};
