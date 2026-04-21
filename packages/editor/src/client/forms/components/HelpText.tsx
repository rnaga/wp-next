import { SxProps } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const HelpText = (props: {
  children: React.ReactNode;
  sx?: SxProps;
}) => {
  const { children, sx } = props;
  return (
    <Typography fontSize={10} color="text.secondary" sx={{ ...sx }}>
      {children}
    </Typography>
  );
};
