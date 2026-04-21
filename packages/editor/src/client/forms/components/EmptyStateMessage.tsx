import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export interface EmptyStateMessageProps {
  message: string;
}

export const EmptyStateMessage = ({ message }: EmptyStateMessageProps) => {
  return (
    <Box
      sx={{
        p: 2,
        textAlign: "center",
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Typography fontSize={12} color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};
