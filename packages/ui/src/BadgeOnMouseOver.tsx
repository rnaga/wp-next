import { Badge, Box, SxProps } from "@mui/material";
import { CSSProperties, useState } from "react";
import { Typography } from "./Typography";

export const BadgeOnMouseOver = (
  props: {
    label: string;
    ref: React.RefObject<HTMLElement | null>;
    onClick: (e: React.MouseEvent) => void;
    slotSxProps?: {
      badgeContent?: SxProps;
      badge?: CSSProperties;
    };
  } & Omit<Parameters<typeof Badge>[0], "onClick" | "ref">
) => {
  const { onClick, label, children, ref, sx, color, ...rest } = props;
  const [invisible, setInvisible] = useState(true);

  return (
    <Badge
      ref={(e) => {
        if (!e) return;

        ref.current = e;

        e.addEventListener("mouseover", () => {
          setInvisible(false);
        });
        e.addEventListener("mouseleave", () => {
          setInvisible(true);
        });
      }}
      invisible={invisible}
      badgeContent={
        <Box
          onClick={(e) => {
            onClick(e);
          }}
          sx={{
            minWidth: 55,
            ...props.slotSxProps?.badgeContent,
          }}
        >
          {label}
        </Box>
      }
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        "& .MuiBadge-badge": {
          top: -11,
          right: 30,
          fontSize: 9,
          opacity: 0.8,
          borderRadius: 1,
          cursor: "pointer",
          "&:hover": {
            opacity: 1,
          },
          ...props.slotSxProps?.badge,
        },
        ...sx,
      }}
      color={color ?? "info"}
      {...rest}
    >
      {children}
    </Badge>
  );
};
