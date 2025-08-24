import { Link as MuiLink } from "@mui/material";
import { ReactNode } from "react";

export const Link = (
  props: Parameters<typeof MuiLink>[0] & { children: ReactNode } & Record<
      string,
      any
    >
) => {
  const { children, sx, component, ...rest } = props;

  return (
    <MuiLink
      {...rest}
      underline="none"
      component={component || "a"}
      sx={{
        display: "inline",
        p: 0,
        m: 0,
        cursor: "pointer",
        "&:hover": {
          backgroundColor: (theme) => theme.palette.action.hover,
        },

        ...sx,
      }}
    >
      {children}
    </MuiLink>
  );
};
