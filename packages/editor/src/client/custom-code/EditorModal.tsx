"use client";

import { logger } from "../../lexical/logger";
import { useCustomCode } from "./use-custom-code";
import { useEffect, useMemo, useRef, useState } from "react";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";

import CodeEditor from "@monaco-editor/react";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Box } from "@mui/material";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Input } from "@rnaga/wp-next-ui/Input";

export const EditorModal = () => {
  const { modal, closeModal, actions: customCodeActions } = useCustomCode();
  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [openConfirm, setOpenConfirm] = useState<{
    open: boolean;
    customCodeId: number;
  }>({ open: false, customCodeId: 0 });

  const descriptionElementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (modal.open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [modal.open]);

  useEffect(() => {
    setTitle(modal.customCode?.post_title);
  }, [modal.customCode?.post_title, modal?.open]);

  const handleEditorMount = (editor: any, monaco: any) => {
    if (!ref) {
      return;
    }
    ref.current = editor;
    editor.getAction("editor.action.formatDocument").run();
  };

  const handleSave = async () => {
    const content = ref?.current?.getValue();

    // Clear any previous errors
    setError(undefined);

    // Validate content and title
    if (!content) {
      setError("Content is required");
      return;
    }

    if (!title && !modal?.customCode?.post_title) {
      setError("Name is required");
      return;
    }

    setLoading(true);

    try {
      // if customCode (post) is provided, update it
      if (modal.customCode?.ID) {
        const result = await customCodeActions.update(modal.customCode.ID, {
          name: title ?? modal.customCode.post_title,
          slug: modal.customCode.post_name,
          content: content,
        });
      } else {
        const name = title ?? `Untitled - ${Math.floor(Math.random() * 1000)}`;
        const slug = name.toLowerCase().replace(/\s+/g, "-");

        // otherwise create a new customCode (post)
        const result = await customCodeActions.create({
          name,
          slug,
          content: content,
          mimeType: modal.mimeType ?? "text/plain",
        });
      }

      // Fetch and set all custom codes tied to the current template
      await customCodeActions.fetchAndSetCurrentCustomCode();
    } catch (e) {
      logger.error("error parsing", e);
      setError(`Error parsing JSON - ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (0 >= id) return;
    await customCodeActions.del(id);

    // Fetch and set all custom codes tied to the current template
    await customCodeActions.fetchAndSetCurrentCustomCode();

    setOpenConfirm({ open: false, customCodeId: 0 });
  };

  const language = useMemo(() => {
    const mimeType = modal.customCode
      ? modal.customCode.metas.mime_type
      : modal.mimeType;
    switch (mimeType) {
      case "text/html":
        return "html";
      case "text/css":
        return "css";
      case "text/javascript":
      case "application/javascript":
        return "javascript";
      default:
        return "plaintext";
    }
  }, [modal.customCode, modal.mimeType]);

  return (
    <>
      <ModalConfirm
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your custom code."
        open={openConfirm.open}
        onClose={() => setOpenConfirm({ open: false, customCodeId: 0 })}
        callback={(confirm) => {
          if (confirm) {
            handleDelete(openConfirm.customCodeId);
            closeModal();
            return;
          }
          setOpenConfirm({ open: false, customCodeId: 0 });
        }}
      />
      <Modal open={modal.open} onClose={closeModal}>
        <ModalContent
          sx={{
            minWidth: "80%",
            maxHeight: "90%",
            overflowY: "auto",
          }}
        >
          <Typography
            size="small"
            color="error"
            sx={{
              display: error ? "block" : "none",
            }}
          >
            {error}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyItems: "center",
              mb: 3,
              gap: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                flexGrow: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Input
                size="large"
                disableBorder
                value={title ?? ""}
                onChange={(value) => setTitle(value)}
                placeholder="Enter Name"
                sx={{
                  fontWeight: 600,
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "top",
                gap: 1,
              }}
            >
              <Button loading={loading} onClick={handleSave}>
                Save
              </Button>
              {modal?.customCode?.ID && (
                <Button
                  color="error"
                  onClick={() =>
                    setOpenConfirm({
                      open: true,
                      customCodeId: modal.customCode?.ID as number,
                    })
                  }
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>
          <Box>
            <CodeEditor
              // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
              options={{
                padding: { bottom: 0 },
                autoIndent: "advanced",
                formatOnPaste: true,
                formatOnType: true,
              }}
              height="70dvh"
              defaultLanguage={language}
              defaultValue={modal.customCode?.post_content}
              onMount={handleEditorMount}
              //onChange={handleEditorChange}
            />
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};
