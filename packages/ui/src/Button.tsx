import { Button as MuiButton } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { useWPTheme } from "./ThemeRegistry";

export const Button = (
  props: {
    children: React.ReactNode;
    size?: "small" | "medium" | "large";
    //color?: "error" | "primary";
    component?: React.ElementType;
    bold?: boolean;
    loading?: boolean;
    color?: "info" | "success" | "warning" | "error" | "primary" | "secondary";
  } & Omit<Parameters<typeof MuiButton>[0], "children" | "size">
) => {
  const { children, size, component, bold, loading, color, disabled, ...rest } =
    props;
  const { wpTheme } = useWPTheme();
  return (
    <MuiButton
      {...rest}
      component={component}
      variant="contained"
      size="small"
      disableElevation
      disabled={loading || disabled === true}
      sx={{
        textTransform: "none",
        fontSize: size === "large" ? 16 : size === "medium" ? 14 : 12,
        ...(bold ? { fontWeight: "bold" } : {}),
        ...(color ? { backgroundColor: wpTheme.colors[color] } : {}),
        ...rest.sx,
      }}
      endIcon={loading ? <CircularProgress size={20} /> : null}
    >
      {children}
    </MuiButton>
  );
};
