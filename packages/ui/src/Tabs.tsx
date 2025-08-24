import { Box, Tab, Tabs as MuiTabs, useTheme, SxProps } from "@mui/material";
import { useEffect, useState } from "react";
import { Typography } from "./Typography";
import React from "react";

export const Tabs = (props: {
  items: {
    label: string;
    content: React.ReactNode;
  }[];
  size?: "small" | "medium" | "large";
  slotSxProps?: {
    tab: SxProps;
    typography?: SxProps;
  };
  sx?: SxProps;
  tabIndex?: number;
  onChange?: (index: number) => void;
}) => {
  const { items, size, tabIndex, onChange } = props;
  const [elementTabIndex, setElementTabIndex] = useState<number>(tabIndex ?? 0);
  const handleElementTabClick = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    // Handle element click logic here
    setElementTabIndex(newValue);

    onChange?.(newValue);
  };

  useEffect(() => {
    if (typeof tabIndex === "number" && elementTabIndex !== tabIndex) {
      setElementTabIndex(tabIndex);
    }
  }, [tabIndex]);

  const selectedContent = items[elementTabIndex]?.content;
  if (!selectedContent) {
    return null;
  }

  return (
    <>
      <MuiTabs
        value={elementTabIndex}
        onChange={handleElementTabClick}
        sx={{
          ...props.sx,
        }}
      >
        {items.map((item, index) => (
          <Tab
            key={index}
            label={
              <Typography
                size={size}
                bold
                fontSize={!size || size === "small" ? 9 : "inherit"}
                sx={{
                  ...props.slotSxProps?.typography,
                }}
              >
                {item.label}
              </Typography>
            }
            value={index}
            sx={{
              textTransform: "none",
              p: 0,
              "&.MuiTab-root": {
                width: `calc(100% / ${items.length})`,
                minWidth: "unset",
              },
              ...props.slotSxProps?.tab,
            }}
          />
        ))}
      </MuiTabs>
      {selectedContent}
    </>
  );
};
