import Box from "@mui/material/Box";
import { Typography } from "@rnaga/wp-next-ui/Typography";
export const RightFormBox = (props: {
  title: string;
  children?: React.ReactNode;
}) => {
  const { title, children } = props;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "left",
        alignItems: "flex-start",
        mb: 1,
        flexDirection: "column",
        gap: 0.3,
      }}
    >
      <Typography>{title}</Typography>
      {children}
    </Box>
  );
};
