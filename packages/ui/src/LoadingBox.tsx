import { Box, CircularProgress, SxProps } from "@mui/material";

export const LoadingBox = (props: {
  children?: React.ReactNode;
  loading: boolean;
  size?: "small" | "medium";
  sx?: SxProps;
  slotSxProps?: {
    innerBox?: SxProps;
    progress?: SxProps;
  };
}) => {
  const { children, loading, size = "small", sx, slotSxProps } = props;

  if (!loading) {
    return children;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: size === "medium" ? 24 : 16, // ensure some height for spinner
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size === "medium" ? 24 : 16,
          height: size === "medium" ? 24 : 16,
          ...slotSxProps?.innerBox,
        }}
      >
        <CircularProgress
          size={size === "medium" ? 24 : 16}
          sx={{
            ...slotSxProps?.progress,
          }}
        />
      </Box>
      <Box
        sx={{
          opacity: 0.3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
