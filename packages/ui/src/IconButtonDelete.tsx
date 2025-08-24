import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";
import { Button } from "./Button";

export const IconButtonDelete = (props: {
  onClick: (...args: any) => any;
  title?: string;
  size?: "small" | "medium" | "large";
}) => {
  const { onClick, title = "Trash", size } = props;
  return (
    <Tooltip title={title} placement="top">
      <Button
        size={size}
        color="error"
        variant="outlined"
        onClick={onClick}
        sx={{
          borderRadius: 2,
          minWidth: "unset",
          "&:hover": {
            opacity: 0.9,
          },
        }}
      >
        <DeleteIcon fontSize={size} />
      </Button>
    </Tooltip>
  );
};
