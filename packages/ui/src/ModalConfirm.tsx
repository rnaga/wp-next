import { useEffect, useState } from "react";

import WarningIcon from "@mui/icons-material/Warning";
import { Box, Divider } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { Button } from "./Button";
import { Modal, ModalContent } from "./Modal";
import { Typography } from "./Typography";

export const ModalConfirm = (props: {
  title?: string;
  message: string | React.ReactNode;
  callback: (confirm: boolean) => void;
  open: boolean;
  onClose?: () => void;
}) => {
  const {
    title = "Are you absolutely sure?",
    message,
    callback,
    onClose,
  } = props;
  const { viewport } = useWP();

  const [open, setOpen] = useState(props.open);

  useEffect(() => {
    if (props.open !== open) {
      setOpen(props.open);
    }
  }, [props.open]);

  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
        onClose?.();
      }}
    >
      <ModalContent
        aria-labelledby="nested-modal-title"
        aria-describedby="nested-modal-description"
        sx={{
          minWidth: "40%",
          ...(viewport.isMobile
            ? {
                top: "unset",
                bottom: 0,
                left: 0,
                right: 0,
                borderRadius: 0,
                transform: "none",
                maxWidth: "unset",
              }
            : {}),
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningIcon />
          <Typography id="nested-modal-title" size="large" bold>
            {title.length > 0 ? title : "Confirmation"}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography
          id="nested-modal-description"
          size="large"
          component="div"
          sx={{
            mt: 1,
            mb: 2,
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </Typography>
        <Box
          sx={{
            mt: 1,
            display: "flex",
            gap: 1,
            flexDirection: { xs: "column", sm: "row-reverse" },
          }}
        >
          <Button
            size="large"
            variant="outlined"
            onClick={() => {
              callback(true);
              setOpen(false);
              onClose?.();
            }}
            color="error"
          >
            Continue
          </Button>
          <Button
            size="large"
            variant="outlined"
            color="primary"
            onClick={() => {
              callback(false);
              setOpen(false);
              onClose?.();
            }}
          >
            Cancel
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};
