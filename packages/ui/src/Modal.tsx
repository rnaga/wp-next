import { createContext, useContext, useEffect, useState } from "react";

import { Close } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  IconButton,
  Modal as MuiModal,
  SxProps,
  Dialog,
} from "@mui/material";
import { useWPTheme } from "./ThemeRegistry";
import { useWP } from "@rnaga/wp-next-core/client/wp";

type ModalParameters = Omit<Parameters<typeof MuiModal>[0], "onClose"> & {
  onClose: VoidFunction;
};

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: VoidFunction;
}>({} as any);

export const Modal = (props: ModalParameters) => {
  const { children, open: muiOpen, onClose, ...rest } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(muiOpen);
  }, [muiOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <MuiModal open={open} onClose={handleClose} {...rest}>
      <Context value={{ open, setOpen, onClose }}>{children}</Context>
    </MuiModal>
  );
};

export const ModalContent = (
  props: {
    sx?: SxProps;
    children: React.ReactNode;
    hideCloseButton?: boolean;
    loading?: boolean;
  } & Omit<
    Parameters<typeof Box>[0],
    "children" | "sx" | "hideCloseButton" | "loading"
  >
) => {
  const { sx, hideCloseButton, loading, ...rest } = props;
  const { setOpen, onClose } = useContext(Context);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { wpTheme } = useWPTheme();

  const { viewport } = useWP();

  useEffect(() => {
    if (viewport.isMobile) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [viewport.isMobile]);

  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        bgcolor: "background.paper",
        boxShadow: 24,
        borderRadius: isFullscreen ? 0 : 1,
        py: 4,
        px: 2,
        ...(isFullscreen && {
          width: "100%",
          height: "100%",
        }),
        ...sx,
      }}
      {...rest}
    >
      <Box
        sx={{
          position: "relative",
        }}
      >
        {!hideCloseButton && (
          <IconButton
            size="small"
            onClick={(e) => {
              setOpen(false);
              onClose();
            }}
            sx={{
              position: "absolute",
              top: isFullscreen ? -25 : -25,
              right: isFullscreen ? -10 : -10,
              zIndex: 1,
              bgcolor: wpTheme.background.color,
              border: "none",
              ":hover": {
                bgcolor: wpTheme.background.hoverColor,
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          props.children
        )}
      </Box>
    </Box>
  );
};
