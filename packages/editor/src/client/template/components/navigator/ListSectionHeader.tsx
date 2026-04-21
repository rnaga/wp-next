import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";

import { Box, IconButton, useTheme } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { BasicIconMenuButton } from "../../../forms/components/BasicIconMenuButton";

type ListSectionHeaderProps =
  | {
      label: string;
      collectionId: number;
      expanded: boolean;
      onToggleExpanded: () => void;
      isFirst: boolean;
      isLast: boolean;
      onMoveUp: () => void;
      onMoveDown: () => void;
      menuOpen: boolean;
      onOpenMenu: () => void;
      onCloseMenu: () => void;
      onRename: () => void;
      onDelete: () => void;
    }
  | { label: string; expanded: boolean; onToggleExpanded: () => void };

export const ListSectionHeader = (props: ListSectionHeaderProps) => {
  const theme = useTheme();
  const isCollection = "collectionId" in props;

  return (
    <Box
      {...(isCollection && !props.expanded
        ? { "data-drop-target-id": String(props.collectionId) }
        : {})}
      onClick={props.onToggleExpanded}
      sx={{
        px: 1.5,
        py: isCollection ? 0.7 : 1.15,
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        backgroundColor: theme.palette.grey[300],
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        userSelect: "none",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: theme.palette.grey[300],
          "& .hover-actions": { visibility: "visible" },
        },
      }}
    >
      {/* Left icon */}
      {isCollection ? (
        props.expanded ? (
          <ExpandMoreIcon
            sx={{ fontSize: 14, color: theme.palette.grey[500], flexShrink: 0 }}
          />
        ) : (
          <ChevronRightIcon
            sx={{ fontSize: 14, color: theme.palette.grey[500], flexShrink: 0 }}
          />
        )
      ) : props.expanded ? (
        <ExpandMoreIcon
          sx={{ fontSize: 14, color: theme.palette.grey[500], flexShrink: 0 }}
        />
      ) : (
        <ChevronRightIcon
          sx={{ fontSize: 14, color: theme.palette.grey[500], flexShrink: 0 }}
        />
      )}

      <Typography
        sx={{
          flex: 1,
          fontSize: "13px",
          fontWeight: 600,
          color: theme.palette.grey[700],
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {props.label}
      </Typography>

      {/* Right side controls */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {isCollection && (
          <Box
            className="hover-actions"
            sx={{
              display: "flex",
              alignItems: "center",
              visibility: props.menuOpen ? "visible" : "hidden",
            }}
          >
            <IconButton
              size="small"
              disabled={props.isFirst}
              onClick={props.onMoveUp}
              sx={{
                p: 0.25,
                color: props.isFirst
                  ? theme.palette.grey[300]
                  : theme.palette.grey[500],
              }}
            >
              <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              disabled={props.isLast}
              onClick={props.onMoveDown}
              sx={{
                p: 0.25,
                color: props.isLast
                  ? theme.palette.grey[300]
                  : theme.palette.grey[500],
              }}
            >
              <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Box onMouseDown={(e) => e.stopPropagation()}>
              <BasicIconMenuButton
                size="small"
                icon={<MenuIcon sx={{ fontSize: 16 }} />}
                open={props.menuOpen}
                onOpen={props.onOpenMenu}
                onClose={props.onCloseMenu}
                items={[
                  { label: "Rename", value: "rename" },
                  { label: "Delete", value: "delete" },
                ]}
                onChange={(value) => {
                  if (value === "rename") {
                    props.onRename();
                  } else if (value === "delete") {
                    props.onDelete();
                  }
                  props.onCloseMenu();
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
