import React, { RefObject, useState } from "react";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const BasicIconMenuButton = (props: {
  ref?: RefObject<HTMLElement | null>;
  items: {
    label: string | React.ReactNode;
    value: string;
  }[];
  onChange: (item: string) => void;
  size?: "small" | "medium";
  icon?: React.ReactNode;
  maxHeight?: number;
  label?: string;
  slotProps?: {
    menu?: Partial<Parameters<typeof Menu>[0]>;
    tooltip?: Partial<Parameters<typeof Tooltip>[0]>;
  };
  open?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}) => {
  const {
    items,
    onChange,
    size = "small",
    ref: buttonRef,
    icon = <MoreVertIcon />,
    maxHeight,
  } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [internalButtonRef, setInternalButtonRef] =
    useState<HTMLElement | null>(null);
  const isControlled = props.open !== undefined;
  const open = isControlled ? Boolean(props.open) : Boolean(anchorEl);

  const [buttonWidth, setButtonWidth] = useState("100px");

  const effectiveAnchorEl = isControlled ? internalButtonRef : anchorEl;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (isControlled && props.onOpen) {
      props.onOpen();
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
    if (props.onClose) {
      props.onClose();
    }
  };

  return (
    <>
      <Tooltip
        title={props.label ? props.label : ""}
        {...props.slotProps?.tooltip}
      >
        <IconButton
          size={size === "small" ? "small" : "medium"}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(e);
          }}
          ref={(ref) => {
            if (ref) {
              setButtonWidth(ref.clientWidth + "px");
              setInternalButtonRef(ref);
              if (buttonRef) {
                buttonRef.current = ref;
              }
            }
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>

      <Menu
        id="basic-menu"
        {...props.slotProps?.menu}
        anchorEl={effectiveAnchorEl}
        open={open}
        autoFocus={false}
        onClose={(e: any, reason) => {
          if (e?.stopPropagation) {
            e.stopPropagation();
          }
          handleClose();
        }}
        sx={{
          maxHeight: maxHeight ? maxHeight : undefined,
          ...props.slotProps?.menu?.sx,
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(item.value);
              handleClose();
            }}
          >
            {typeof item.label === "string" ? (
              <Typography fontSize={size == "medium" ? 14 : 12}>
                {item.label}
              </Typography>
            ) : (
              item.label
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
