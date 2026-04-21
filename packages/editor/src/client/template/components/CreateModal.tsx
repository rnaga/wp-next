import { useEffect, useState } from "react";
import { logger } from "../../../lexical/logger";

import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";

import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useEditorServerActions } from "../../hooks/use-editor-server-actions";
import { useRefresh } from "../../refresh";
import { useTemplate } from "../use-template";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { TEMPLATE_CREATED_COMMAND } from "../commands";
import { CollectionDropdown } from "./CollectionDropdown";

export const CreateModal = (props: {
  open: boolean;
  onClose: () => void;
  hideCloseButton?: boolean;
}) => {
  const { open, onClose, hideCloseButton } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const { actions, safeParse } = useEditorServerActions();
  const { switchTemplate } = useTemplate();
  const { refresh } = useRefresh();

  const [templateName, setTemplateName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");
  const [collectionId, setCollectionId] = useState<number | undefined>(
    undefined
  );

  const { wpHooks } = useWP();

  useEffect(() => {
    // Clear form when modal opens
    if (open) {
      setTemplateName("");
      setTemplateSlug("");
      setCollectionId(undefined);
      setSuccessMessage(undefined);
      setError(undefined);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!templateName) {
      setError("Template name is required");
      return;
    }

    setLoading(true);
    setError(undefined);
    setSuccessMessage(undefined);

    const result = await actions.template
      .create(
        templateName,
        templateSlug || templateName,
        collectionId != null ? { collectionId } : undefined
      )
      .then(safeParse);

    if (!result.success) {
      logger.error("Error creating template", result.error);
      setError(`${result.error}`);
      setLoading(false);
      return;
    }

    refresh(["template"]); // refresh template list
    setLoading(false);
    const newTemplateId = result.data as number;

    setSuccessMessage("Template created successfully!");

    // Defer switchTemplate so it runs after the Next.js router processes the
    // revalidation triggered by revalidateTag inside the create server action.
    // Without the delay, router.push (called inside switchTemplate) races against
    // the revalidation response and loses in production — the URL never changes
    // and the new template never loads.
    setTimeout(() => {
      switchTemplate(newTemplateId, () => {
        onClose();
        wpHooks.action.doCommand(TEMPLATE_CREATED_COMMAND, {
          templateId: newTemplateId,
        });
      });
    }, 100);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent
        sx={{
          minWidth: "40vw",
        }}
        hideCloseButton={hideCloseButton}
      >
        <Typography size="large" bold sx={{ mb: 2 }}>
          Create Template
        </Typography>
        <form
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
            }}
          >
            {error && <Typography color="error">{error}</Typography>}
            {successMessage && (
              <Typography color="success">{successMessage}</Typography>
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography size="medium" bold>
                Template Name
              </Typography>
              <Input
                size="large"
                placeholder="Template Name"
                value={templateName}
                onChange={(value) => setTemplateName(value)}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography size="medium" bold>
                Slug
              </Typography>
              <Input
                size="large"
                placeholder="Slug"
                value={templateSlug}
                onChange={(value) => setTemplateSlug(value)}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography size="medium" bold>
                Collection
              </Typography>
              <CollectionDropdown
                value={collectionId}
                onChange={setCollectionId}
              />
            </Box>
            <Button type="submit" loading={loading} size="medium">
              Create Template
            </Button>
          </Box>
        </form>
      </ModalContent>
    </Modal>
  );
};
