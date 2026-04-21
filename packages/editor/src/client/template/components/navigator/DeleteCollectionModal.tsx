import { useState } from "react";

import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useRefresh } from "../../../refresh";

export const DeleteCollectionModal = (props: {
  open: boolean;
  collectionId: number;
  collectionName: string;
  onClose: () => void;
}) => {
  const { open, collectionId, collectionName, onClose } = props;
  const [loading, setLoading] = useState<"moveToTop" | "deleteAll" | null>(
    null
  );
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const { actions } = useEditorServerActions();
  const { refresh } = useRefresh();

  const handleDeleteAll = async () => {
    setLoading("deleteAll");
    await actions.template.deleteCollection(collectionId, {
      deleteTemplates: true,
    });
    refresh(["template"]);
    setLoading(null);
    onClose();
  };

  const handleMoveToTop = async () => {
    setLoading("moveToTop");
    await actions.template.deleteCollection(collectionId);
    refresh(["template"]);
    setLoading(null);
    onClose();
  };

  return (
    <>
      <ModalConfirm
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete all templates inside this collection."
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        callback={(confirm) => {
          if (confirm) {
            handleDeleteAll();
          }
          setConfirmDeleteAll(false);
        }}
      />
      <Modal open={open} onClose={onClose}>
        <ModalContent sx={{ minWidth: "36vw" }}>
          <Typography size="large" bold sx={{ mb: 1 }}>
            Delete Collection
          </Typography>
          <Typography
            size="medium"
            sx={{ mb: 3, color: (theme) => theme.palette.grey[600] }}
          >
            What should happen to the templates inside &quot;{collectionName}
            &quot;?
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {loading !== "deleteAll" && (
              <Button
                size="medium"
                loading={loading === "moveToTop"}
                onClick={handleMoveToTop}
              >
                Move templates to top level
              </Button>
            )}
            {loading !== "moveToTop" && (
              <Button
                size="medium"
                loading={loading === "deleteAll"}
                onClick={() => setConfirmDeleteAll(true)}
                color="error"
              >
                Delete all templates inside
              </Button>
            )}
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};
