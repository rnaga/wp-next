import { Box } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { ReactNode } from "react";
import { MenuButton } from "mui-tiptap";

export interface RichtextareaMenuItemsProps {
  showExpandButton?: boolean;
  onExpandClick?: () => void;
  dataInputDecorator?: ReactNode;
}

export const RichtextareaMenuItems = (props: RichtextareaMenuItemsProps) => {
  const { showExpandButton = true, onExpandClick, dataInputDecorator } = props;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {dataInputDecorator}
      {showExpandButton && onExpandClick && (
        <MenuButton
          value="expand"
          tooltipLabel="Expand editor"
          IconComponent={OpenInFullIcon}
          onClick={onExpandClick}
        />
      )}
    </Box>
  );
};
