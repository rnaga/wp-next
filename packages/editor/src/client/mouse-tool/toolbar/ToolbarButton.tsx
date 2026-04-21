import React, { ReactElement } from "react";
import { Button, Tooltip, IconButtonProps } from "@mui/material";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

type Props = Parameters<typeof Button>[0] & {
  children: ReactElement<IconButtonProps>;
  title: string;
};

export const ToolbarButton = ({ sx, children, title, ...rest }: Props) => {
  const { wpTheme } = useWPTheme();
  return (
    <Button
      sx={{
        border: "none",
        minHeight: 0,
        borderRadius: 0,
        minWidth: 25,
        p: 0.5,
        color: wpTheme.mousetoolBox.color,
        backgroundColor: wpTheme.mousetoolBox.backgroundColor,
        "&:hover": {
          backgroundColor: wpTheme.mousetoolBox.hover.backgroundColor,
        },
        ...sx,
      }}
      {...rest}
    >
      <Tooltip title={title} placement="top">
        {React.cloneElement(children, { sx: { width: 16, height: 16 } })}
      </Tooltip>
    </Button>
  );
};
