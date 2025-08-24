import { ClickAwayListener, Menu } from "@mui/material";

export const PopperMenu = (
  props: {
    open: boolean;
    children: React.ReactNode;
    onClose: () => void;
  } & Omit<React.ComponentProps<typeof Menu>, "open" | "onClose">
) => {
  const {
    ref,
    open,
    children,
    anchorEl,
    onClose,

    ...rest
  } = props;
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose} {...rest}>
      {children}
    </Menu>
  );
};
