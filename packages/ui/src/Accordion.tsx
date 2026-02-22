import {
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export const Accordion = (props: Parameters<typeof MuiAccordion>[0]) => {
  return (
    <MuiAccordion
      disableGutters
      elevation={0}
      square
      sx={{
        backgroundColor: "transparent",
        my: 0,
        "& .MuiAccordionDetails-root": {
          px: 0.5,
        },
        ...props.sx,
      }}
      {...props}
    >
      {props.children}
    </MuiAccordion>
  );
};

export const AccordionSummary = (
  props: Parameters<typeof MuiAccordionSummary>[0]
) => {
  return (
    <MuiAccordionSummary expandIcon={<ExpandMoreIcon />}>
      {props.children}
    </MuiAccordionSummary>
  );
};
