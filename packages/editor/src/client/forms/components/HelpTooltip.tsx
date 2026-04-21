import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import { Tooltip } from "@mui/material";

export const HelpTooltip = (props: { title: string }) => {
  return (
    <Tooltip title={props.title} placement="top" arrow>
      <HelpOutlineIcon sx={{ fontSize: 14, color: "text.secondary" }} />
    </Tooltip>
  );
};
