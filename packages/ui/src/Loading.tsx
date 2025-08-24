import { Box, LinearProgress, SxProps } from "@mui/material";

export const Loading = (props: {
  children?: React.ReactNode;
  loading: boolean;
  sx?: SxProps;
}) => {
  const { children, loading } = props;

  if (!loading) {
    return children;
  }

  return (
    <Box
      sx={{
        ...props.sx,
        width: "inherit",
        height: "inherit",
        position: "relative",
      }}
    >
      <>
        <Box
          sx={{
            position: "absolute",
            zIndex: 100,
            top: 0,
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
            }}
          >
            <LinearProgress />
          </Box>
        </Box>
        <Box
          sx={{
            position: "absolute",
            zIndex: 100,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: "30%",
          }}
        ></Box>
      </>
    </Box>
  );
};
