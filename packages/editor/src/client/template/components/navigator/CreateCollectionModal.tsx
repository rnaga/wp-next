import { useEffect, useState } from "react";

import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useRefresh } from "../../../refresh";

export const CreateCollectionModal = (props: {
  open: boolean;
  onClose: () => void;
}) => {
  const { open, onClose } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [name, setName] = useState("");
  const { actions, safeParse } = useEditorServerActions();
  const { refresh } = useRefresh();

  useEffect(() => {
    if (open) {
      setName("");
      setError(undefined);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name) {
      setError("Collection name is required");
      return;
    }

    setLoading(true);
    setError(undefined);

    const result = await actions.template
      .createCollection(name)
      .then(safeParse);

    if (!result.success) {
      setError(`${result.error}`);
      setLoading(false);
      return;
    }

    refresh(["template"]);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent sx={{ minWidth: "40vw" }}>
        <Typography size="large" bold sx={{ mb: 2 }}>
          Create Collection
        </Typography>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Typography color="error">{error}</Typography>}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography size="medium" bold>
                Collection Name
              </Typography>
              <Input
                size="large"
                placeholder="Collection Name"
                value={name}
                onChange={(value) => setName(value)}
              />
            </Box>
            <Button type="submit" loading={loading} size="medium">
              Create Collection
            </Button>
          </Box>
        </form>
      </ModalContent>
    </Modal>
  );
};
