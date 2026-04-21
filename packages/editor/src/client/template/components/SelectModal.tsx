import { Box } from "@mui/material";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";

import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Dropdown } from "./Dropdown";
import { useTemplate } from "../use-template";

export const SelectModal = (props: {
  open: boolean;
  onClose: () => void;
  hideCloseButton?: boolean;
}) => {
  const { open, onClose, hideCloseButton } = props;
  const { closeSelectModal, switchTemplate } = useTemplate();

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent
        sx={{
          minWidth: "30vw",
        }}
        hideCloseButton={hideCloseButton}
      >
        <Typography size="large" bold sx={{ mb: 2 }}>
          Select Template
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          <Dropdown
            onChange={(template) => {
              if (template?.ID) {
                switchTemplate(template.ID, () => {
                  closeSelectModal();
                });
              }
            }}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
};
