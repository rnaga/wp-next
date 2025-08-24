import { Typography as MuiTypography } from "@mui/material";

export const Typography = (
  props: {
    size?: "small" | "medium" | "large" | "xlarge";
    children: React.ReactNode;
    bold?: boolean;
    fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    component?: React.ElementType;
  } & Omit<Parameters<typeof MuiTypography>[0], "children">
) => {
  const { size, children, bold, fontWeight, component, ...rest } = props;
  return (
    <MuiTypography
      component={component}
      variant={size === "large" ? "body1" : undefined}
      fontWeight={fontWeight ? fontWeight : bold ? "bold" : "normal"}
      fontSize={
        size === "large"
          ? undefined
          : size === "xlarge"
          ? 20
          : size === "medium"
          ? 14
          : 12
      }
      {...rest}
    >
      {children}
    </MuiTypography>
  );
};
