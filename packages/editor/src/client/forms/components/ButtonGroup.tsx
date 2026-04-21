import React, { useEffect, useState } from "react";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Box,
  ButtonGroup as MuiButtonGroup,
  Menu,
  MenuItem,
  SxProps,
  Tooltip,
} from "@mui/material";
import Button from "@mui/material/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const ButtonGroup = (props: {
  enum:
    | {
        label: string | React.ReactNode;
        tooltip?: string;
        value: any;
      }[]
    | undefined;
  showCount?: number;
  fontSize?: number;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  value?: any;
  sx?: SxProps;
  slotSxProps?: {
    button?: SxProps;
    buttonDropdown?: SxProps;
    buttonLabel?: SxProps;
  };
}) => {
  const {
    enum: options,
    showCount = 3,
    onChange,
    placeholder,
    fontSize = 10,
    sx,
  } = props;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [value, setValue] = useState<any>(props.value);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (newValue: any) => {
    onChange(newValue);
    handleClose();

    // If the new value is the same as the current value, reset it to undefined
    if (value === newValue) {
      setValue(undefined);
      return;
    }

    setValue(newValue);
  };

  const handleButtonClick = (optionValue: any) => {
    if (value === optionValue) {
      onChange(undefined);
      setValue(undefined);
    } else {
      onChange(optionValue);
      setValue(optionValue);
    }
  };

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  return (
    <Box sx={sx}>
      <MuiButtonGroup sx={{ mx: 0, maxWidth: "100%", display: "flex" }}>
        {options?.slice(0, showCount).map((option) => (
          <Tooltip
            key={option.value}
            title={option.tooltip || ""}
            placement="top"
          >
            <Button
              size="small"
              key={option.value}
              onClick={() => handleButtonClick(option.value)}
              variant={value === option.value ? "contained" : "outlined"}
              sx={{
                flex: 1,
                ...props.slotSxProps?.button,
              }}
            >
              <Typography
                fontSize={fontSize}
                sx={{
                  ...props.slotSxProps?.buttonLabel,
                }}
              >
                {option.label}
              </Typography>
            </Button>
          </Tooltip>
        ))}
        {options && options.length > showCount && (
          <Button
            size="small"
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleClick}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              flex: 1,
              "& .MuiButton-endIcon": {
                m: 0,
              },
              ...props.slotSxProps?.buttonDropdown,
            }}
          >
            <Typography
              fontSize={fontSize}
              sx={{
                ml: 1,
                ...props.slotSxProps?.buttonLabel,
              }}
            >
              {placeholder || "More"}
            </Typography>
          </Button>
        )}
      </MuiButtonGroup>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options?.slice(showCount).map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => handleMenuItemClick(option.value)}
          >
            <Typography fontSize={12}>{option.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
