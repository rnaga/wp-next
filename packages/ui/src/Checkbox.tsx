import { Box, Checkbox as MuiCheckbox } from "@mui/material";
import { Typography } from "./Typography";

export const Checkbox = (
  props: {
    label?: string;
    size?: "small" | "medium";
  } & Parameters<typeof MuiCheckbox>[0]
) => {
  const { label, size, ...rest } = props;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <MuiCheckbox
        size={"small"}
        {...rest}
        sx={{
          "& .MuiFormControlLabel-label": {
            fontSize: "0.875rem",
          },
          height: size === "small" ? 16 : 20,
          ...rest.sx,
        }}
      />
      {label && <Typography size={size}>{label}</Typography>}
    </Box>
  );
};
