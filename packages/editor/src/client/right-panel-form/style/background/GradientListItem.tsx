import { Box } from "@mui/material";
import { isColorString } from "@rnaga/wp-next-ui/InputColor";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const GradientListItem = (props: { value: string }) => {
  if (isColorString(props.value)) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: 24,
          backgroundColor: props.value,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: 24,
        backgroundColor: "transparent",
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography size={"small"}>{props.value}</Typography>
    </Box>
  );
};
