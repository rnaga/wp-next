import { Box, Chip as MuiChip, SxProps, useColorScheme } from "@mui/material";
import { Typography } from "./Typography";
import { useWPTheme } from "./ThemeRegistry";

export const Chip = (props: {
  size?: "small" | "medium" | "large";
  color?: "yellow" | "orange" | "purple" | "grey";
  label: string | number;
  opacity?: number;
  sx?: SxProps;
  onClick?: () => void;
}) => {
  const { size = "medium", label, sx, color, opacity, onClick } = props;

  const defaultColor = "240, 240, 240";
  const baseColor =
    color === "yellow"
      ? "212, 178, 0"
      : color === "orange"
      ? "240, 101, 41"
      : color === "purple"
      ? "86, 61, 124"
      : color === "grey"
      ? "211, 211, 211" // lighter grey
      : defaultColor;

  const backgroundColor =
    baseColor !== undefined
      ? `rgba(${baseColor}, ${opacity !== undefined ? opacity : 1})`
      : undefined;

  return (
    <Box
      sx={{
        fontSize: size === "large" ? 12 : size === "medium" ? 10 : 8,
        backgroundColor,
        //color: backgroundColor == undefined ? undefined : "white",

        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        //width: size === "large" ? 32 : size === "medium" ? 24 : 20,
        //height: size === "large" ? 32 : size === "medium" ? 24 : 20,
        //borderRadius: "50%",
        p: 0.5,
        borderRadius: 1.5,
        ...(onClick && {
          cursor: "pointer",
        }),
        ...sx,
      }}
      onClick={onClick}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: size === "large" ? 12 : size === "medium" ? 10 : 8,
          color: color === "grey" || !color ? "black" : "white",
          m: 0,
          p: 0,
        }}
        bold
      >
        {label}
      </Typography>
    </Box>
  );
};
