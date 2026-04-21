import { Typography as MuiTypography, TypographyProps } from "@mui/material";
import { CSSProperties } from "@mui/material/styles";

export const Typography = (
  props: {
    size?: "small" | "medium" | "large" | "xlarge";
    children: React.ReactNode;
    bold?: boolean;
    fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    component?: React.ElementType;
    fontSize?: number | string;
  } & Omit<TypographyProps, "children">
) => {
  const {
    size,
    children,
    bold,
    fontWeight,
    component,
    sx: userSx,
    ...rest
  } = props;

  const sizeFontSize =
    size === "large" ? undefined : size === "xlarge" ? 20 : size === "medium" ? 14 : 12;
  const propsFontSize =
    props.fontSize !== undefined
      ? typeof props.fontSize === "number"
        ? `${props.fontSize}px`
        : props.fontSize
      : sizeFontSize;

  // Keep font-size precedence in one place: props default first, then explicit sx override.
  const fontSize =
    (userSx as CSSProperties)?.fontSize !== undefined
      ? (userSx as CSSProperties).fontSize
      : propsFontSize;

  const fontWeightValue = (userSx as any)?.fontWeight
    ? (userSx as any).fontWeight
    : fontWeight
      ? fontWeight
      : bold
        ? 700
        : 400;

  return (
    <MuiTypography
      {...(component !== undefined ? ({ component } as any) : {})}
      variant={size === "large" ? "body1" : undefined}
      sx={{
        ...(userSx as any),
        fontSize,
        fontWeight: fontWeightValue,
      }}
      {...rest}
    >
      {children}
    </MuiTypography>
  );
};
