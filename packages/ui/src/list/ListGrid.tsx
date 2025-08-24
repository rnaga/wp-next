import { Grid } from "@mui/material";
import { AccordionSummary } from "../Accordion";
import { Typography } from "../Typography";

export const ListGridTitle = (props: {
  title: string;
  defaultTitle?: string;
}) => {
  const { title, defaultTitle = "(No Title)" } = props;
  return (
    <AccordionSummary>
      <Typography sx={{ wordWrap: "break-word", maxWidth: "90%" }}>
        {title || defaultTitle}
      </Typography>
    </AccordionSummary>
  );
};

export const ListGrid = (props: { children: React.ReactNode }) => {
  return (
    <Grid container rowSpacing={1} sx={{ width: "100%", mt: 2 }}>
      {props.children}
    </Grid>
  );
};

export const ListGridItem = (props: {
  title: string;
  children: React.ReactNode;
}) => {
  const { title, children } = props;
  return (
    <>
      {" "}
      <Grid size={{ xs: 3 }}>
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      </Grid>
      <Grid size={{ xs: 9 }}>
        <Typography component="span">{children}</Typography>
      </Grid>
    </>
  );
};
