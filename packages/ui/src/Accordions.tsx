import React, { FC, JSX } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary as MuiAccodionSummary,
  SxProps,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography } from "./Typography";
import { useWPTheme } from "./ThemeRegistry";

export const Accordions = (
  props: {
    items: {
      title: string;
      content: JSX.Element;
    }[];
    defaultExpanded?: number[];
    // prop to allow only one accordion to be expanded at a time
    allowSingleExpanded?: boolean;
    height?: number;
    sx?: SxProps;
    slotProps?: {
      summary?: Parameters<typeof MuiAccodionSummary>[0];
      title?: Parameters<typeof Typography>[0];
    };
    size?: "small" | "medium";
  } & Omit<
    Parameters<typeof Accordion>[0],
    "sx" | "defaultExpanded" | "children"
  >
) => {
  const {
    items,
    defaultExpanded,
    sx,
    height,
    allowSingleExpanded = false,
    slotProps,
    size,
    ...rest
  } = props;

  const [expdanded, setExpanded] = React.useState<number | undefined>(
    defaultExpanded ? defaultExpanded[0] : -1
  );

  const { wpTheme } = useWPTheme();

  const { sx: summarySx, ...summarySlotProps } = slotProps?.summary || {};
  const { sx: titleSx, ...titleSlotProps } = slotProps?.title || {};

  return items.map((item, index) => {
    return (
      <Accordion
        expanded={allowSingleExpanded ? expdanded === index : undefined}
        key={index}
        {...(!allowSingleExpanded && {
          defaultExpanded: defaultExpanded
            ? defaultExpanded.includes(index)
            : true,
        })}
        disableGutters
        elevation={0}
        square
        sx={{
          //backgroundColor: wpTheme.background.color,
          ...sx,
        }}
        {...rest}
      >
        <MuiAccodionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: height ?? 20,
            "& .MuiAccordionSummary-content": {
              my: 0.5,
            },
            //color: wpTheme.text.color,
            ...summarySx,
          }}
          onClick={() => {
            if (allowSingleExpanded) {
              setExpanded(index === expdanded ? undefined : index);
            }
          }}
          {...summarySlotProps}
        >
          <Typography
            size={size}
            sx={{
              fontWeight: 600,
              lineHeight: "20px",
              my: 1,
              ...titleSx,
            }}
            {...titleSlotProps}
          >
            {item.title}
          </Typography>
        </MuiAccodionSummary>
        <AccordionDetails>{item.content}</AccordionDetails>
      </Accordion>
    );
  });
};
