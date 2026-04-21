import { Box, Divider, IconButton, Modal, Tooltip } from "@mui/material";
import * as types from "../../types";
import { useEffect, useState, useTransition } from "react";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import { ListCSSVariables } from "./ListCSSVariables";

import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { CSSVariablesMenu } from "../forms/components/CSSVariablesMenu";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useCSSVariables } from "./CSSVariablesContext";
import { Button } from "@rnaga/wp-next-ui/Button";

const CreateCSSVariablePost = (props: {
  open: boolean;
  onClose: () => void;
  onSubmit: (ID: number) => void;
}) => {
  const { open, onClose, onSubmit } = props;
  const { actions, parse } = useEditorServerActions();
  const [name, setName] = useState("");
  const [loading, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const [ID] = await actions.cssVariables
        .create({ name, content: [] })
        .then(parse);
      setName("");
      onSubmit(ID);
    });
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  useEffect(() => () => setName(""), []);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          width: 420,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography size="large" sx={{ fontWeight: 600, mb: 0.5 }}>
          New Collection
        </Typography>
        <Typography size="small" sx={{ color: "text.secondary", mb: 3 }}>
          A collection groups related CSS variables together.
        </Typography>
        <Input
          size="medium"
          placeholder="Collection name"
          sx={{ width: "100%" }}
          value={name}
          onChange={(value) => setName(value)}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mt: 3,
          }}
        >
          <Button
            loading={loading}
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create
          </Button>
          <Button onClick={handleClose} disabled={loading} color="error">
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export const CSSVariablesModal = (props: {
  open: boolean;
  onClose: () => void;
  ID?: number;
}) => {
  const { open, onClose } = props;
  const [loading, startTransition] = useTransition();

  const {
    cssVariablesList,
    del: delCSSVariables,
    fetchCSSVariablesList,
    undoSoftUpdate,
  } = useCSSVariables();
  const [selectedCSSVariables, setSelectedCSSVariables] =
    useState<types.CSSVariables>();

  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const handleSubmit = (ID: number) => {
    const selected = cssVariablesList.find(
      (cssVariable) => cssVariable.ID === ID
    );

    fetchCSSVariablesList().then(() => {
      setSelectedCSSVariables(selected);
      setOpenCreate(false);
    });
  };

  const handleClose = async () => {
    setOpenCreate(false);
    await undoSoftUpdate();
  };

  const handleDelete = (confirm: boolean) => {
    if (!confirm) {
      setOpenDelete(false);
      return;
    }

    startTransition(async () => {
      if (selectedCSSVariables) {
        await delCSSVariables(selectedCSSVariables);
        setSelectedCSSVariables(undefined);
      }

      await fetchCSSVariablesList();

      setOpenDelete(false);
    });
  };

  useEffect(() => {
    if (props.ID) {
      const selected = cssVariablesList.find(
        (cssVariable) => cssVariable.ID === props.ID
      );
      setSelectedCSSVariables(selected);
    }
  }, [props.ID, cssVariablesList]);

  return (
    <>
      <ModalConfirm
        title={"Delete CSS Variable"}
        open={openDelete}
        callback={handleDelete}
        message={
          "Are you sure you want to delete this CSS variable? This action cannot be undone."
        }
      />

      <CreateCSSVariablePost
        open={openCreate}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70%",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
          }}
        >
          {/* Modal title */}
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography size="large" sx={{ fontWeight: 600, mb: 0.5 }}>
                CSS Variable Collections
              </Typography>
              <Typography size="small" sx={{ color: "text.secondary" }}>
                Manage named collections of CSS variables and their values.
              </Typography>
            </Box>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} sx={{ ml: "auto" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Collection selector toolbar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <Box sx={{ width: 280 }}>
              <Typography
                size="small"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                Collection:
              </Typography>
              <CSSVariablesMenu
                size="medium"
                cssVariablesList={cssVariablesList}
                onChange={(cssVariable) => {
                  setSelectedCSSVariables(cssVariable);
                }}
                loading={loading}
                label={
                  loading && openCreate
                    ? "Loading..."
                    : selectedCSSVariables?.name
                      ? selectedCSSVariables.name
                      : "Select collection"
                }
                sx={{ minWidth: "100%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: "auto",
              }}
            >
              <Button
                size="small"
                endIcon={<AddIcon />}
                onClick={() => setOpenCreate(true)}
              >
                New Collection
              </Button>
              {selectedCSSVariables && (
                <Tooltip title="Delete collection" placement="top">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setOpenDelete(true)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              marginTop: 2,
              position: "relative",
              minHeight: 300,
            }}
          >
            <ListCSSVariables ID={selectedCSSVariables?.ID} />

            {!selectedCSSVariables && (
              <Box
                sx={{
                  position: "absolute",
                  padding: 1,
                  textAlign: "center",
                  top: "50%",
                  left: "50%",
                  transform: "translateY(-50%) translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                {cssVariablesList.length == 0 ? (
                  <>
                    <Typography size="medium">
                      No CSS Variable Collections available.
                    </Typography>
                    <Button sx={{ my: 1 }} onClick={() => setOpenCreate(true)}>
                      Create
                    </Button>
                  </>
                ) : (
                  <Typography size="medium">
                    Select or create a CSS variable to see its content
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};
