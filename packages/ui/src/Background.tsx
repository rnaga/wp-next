import { Box } from "@mui/material";

export const Background = (props: { zIndex?: number; onClose: () => void }) => {
  const { zIndex = 999, onClose } = props;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex,
        // background color a little lighter than the background
        backgroundColor: "rgba(0,0,0,0.1)",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
    />
  );
};
