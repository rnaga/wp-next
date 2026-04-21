import { Menu, MenuItem as MenuItemMui } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const MenuItem = (props: {
  onClick: (e: MouseEvent) => void;
  title: string;
  disabled?: boolean;
}) => {
  const { onClick, title, disabled = false } = props;
  return (
    <MenuItemMui
      onClick={(e) => onClick(e as unknown as MouseEvent)}
      disabled={disabled}
    >
      <Typography
        sx={{
          fontWeight: 500,
        }}
      >
        {title}
      </Typography>
    </MenuItemMui>
  );
};
