import { Button } from "./Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { Fragment, RefObject, useEffect, useRef, useState } from "react";
import { Typography } from "./Typography";
import { useWPTheme } from "./ThemeRegistry";

export type BasicMenuButtonItem = {
  label: string;
  value: string;
};

export const BasicMenuButton = (
  props: {
    ref?: RefObject<HTMLElement | null>;
    items: BasicMenuButtonItem[];
    onChange: (value: string, item: BasicMenuButtonItem) => void;
    label?: string;
    size?: "small" | "medium";
    value?: string;
    showArrowIcon?: boolean;
    disabled?: boolean;
  } & Omit<
    Parameters<typeof Button>[0],
    "onChange" | "ref" | "label" | "value" | "children" | "disabled"
  >
) => {
  const {
    onChange,
    label,
    ref: buttonRef,
    size,
    showArrowIcon = true,
    disabled = false,
    ...rest
  } = props;
  const fontSize = size == "medium" ? 14 : 12;

  const { wpTheme } = useWPTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [buttonValue, setButtonValue] = useState<string>();
  const [buttonWidth, setButtonWidth] = useState("100px");
  const [items, setItems] = useState<typeof props.items>();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    setButtonValue(label);
  }, [label]);

  useEffect(() => {
    setItems(props.items);
  }, [props.items]);

  return (
    <Fragment key={label}>
      <Button
        {...rest}
        id="basic-button"
        size="small"
        disabled={disabled}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          textTransform: "none",
          border: "1px solid",
          borderColor: wpTheme.border.color,
          justifyContent: "space-between",
          height: size == "medium" ? 32 : 24,
          //color: (theme) => theme.palette.text.primary,
          backgroundColor: wpTheme.background.color,
          color: wpTheme.text.color,
          ...rest.sx,
        }}
        ref={(ref) => {
          if (ref) {
            setButtonWidth(ref.clientWidth + "px");
            if (buttonRef) {
              buttonRef.current = ref;
            }
          }
        }}
      >
        <Typography
          fontSize={fontSize}
          sx={{
            ...(disabled ? { opacity: 0.5 } : {}),
          }}
        >
          {buttonValue}
        </Typography>
        {disabled === false && (
          <>
            {showArrowIcon && !open && <ArrowDropDownIcon fontSize="small" />}
            {showArrowIcon && open && <ArrowDropUpIcon fontSize="small" />}
          </>
        )}
      </Button>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={disabled === true ? false : open}
        onClose={handleClose}
        sx={{
          width: "100%",
        }}
      >
        {items?.map((item, index) => (
          <MenuItem
            key={index}
            onClick={(e) => {
              onChange(item.value, item);
              setButtonValue(item.label);
              handleClose();
            }}
            sx={{
              width: buttonWidth,
            }}
          >
            <Typography
              fontSize={fontSize}
              sx={{
                minHeight: size == "medium" ? 20 : 16,
              }}
              component={"div"}
            >
              {item.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Fragment>
  );
};
