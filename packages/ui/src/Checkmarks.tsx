import { Button } from "./Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { Fragment, RefObject, useEffect, useState } from "react";
import { Typography } from "./Typography";
import { useWPTheme } from "./ThemeRegistry";
import { Checkbox } from "./Checkbox";

export type CheckmarksItem = {
  label: string;
  value: string;
};

export const Checkmarks = (
  props: {
    ref?: RefObject<HTMLElement | null>;
    items: CheckmarksItem[];
    onChange: (values: string[], items: CheckmarksItem[]) => void;
    label?: string;
    size?: "small" | "medium";
    values?: string[];
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
    values = [],
    ...rest
  } = props;
  const fontSize = size == "medium" ? 14 : 12;

  const { wpTheme } = useWPTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [selectedValues, setSelectedValues] = useState<string[]>(values);
  const [buttonWidth, setButtonWidth] = useState("100px");
  const [items, setItems] = useState<typeof props.items>();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (value: string, item: CheckmarksItem) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newSelectedValues);

    const selectedItems = props.items.filter((item) =>
      newSelectedValues.includes(item.value)
    );
    onChange(newSelectedValues, selectedItems);
  };

  useEffect(() => {
    setSelectedValues(values);
  }, [values]);

  useEffect(() => {
    setItems(props.items);
  }, [props.items]);

  const buttonLabel =
    selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : label || "Select items";

  return (
    <Fragment key={label}>
      <Button
        {...rest}
        id="checkmarks-button"
        size="small"
        disabled={disabled}
        aria-controls={open ? "checkmarks-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          textTransform: "none",
          border: "1px solid",
          borderColor: wpTheme.border.color,
          justifyContent: "space-between",
          height: size == "medium" ? 32 : 24,
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
          {buttonLabel}
        </Typography>
        {disabled === false && (
          <>
            {showArrowIcon && !open && <ArrowDropDownIcon fontSize="small" />}
            {showArrowIcon && open && <ArrowDropUpIcon fontSize="small" />}
          </>
        )}
      </Button>

      <Menu
        id="checkmarks-menu"
        anchorEl={anchorEl}
        open={disabled === true ? false : open}
        onClose={handleClose}
        sx={{
          width: "100%",
        }}
      >
        {items?.map((item, index) => {
          const isChecked = selectedValues.includes(item.value);

          return (
            <MenuItem
              key={index}
              onClick={(e) => {
                handleToggle(item.value, item);
              }}
              sx={{
                width: buttonWidth,
              }}
            >
              <Checkbox
                checked={isChecked}
                size={size}
                sx={{
                  padding: 0,
                  marginRight: 1,
                }}
              />
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
          );
        })}
      </Menu>
    </Fragment>
  );
};
