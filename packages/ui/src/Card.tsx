import { Card as MuiCard } from "@mui/material";

export const Card = (
  props: {
    children: React.ReactNode;
    sx?: React.CSSProperties;
  } & React.ComponentProps<typeof MuiCard>
) => {
  const { children, sx, ...rest } = props;

  return (
    <MuiCard
      sx={{
        padding: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 2,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </MuiCard>
  );
};
