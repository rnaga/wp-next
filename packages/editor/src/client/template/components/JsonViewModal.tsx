import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CodeEditor from "@monaco-editor/react";
import { Box, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";

import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useRefresh } from "../../refresh";
import { useTemplate } from "../use-template";
import { processAndGetTemplate } from "../../../lexical";
import { validateLexicalJson } from "../../../lexical/validate-lexical-json";

export const JsonViewModal = (props: {
  open: boolean;
  onClose: () => void;
  brokenJson?: string;
  loadError?: string;
}) => {
  const { open, onClose, brokenJson, loadError } = props;
  const [editor] = useLexicalComposerContext();
  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const { current } = useTemplate();
  const { refresh } = useRefresh();

  // Show load error (e.g. from broken DB JSON) when modal opens with one.
  useEffect(() => {
    if (open && loadError) {
      setError(loadError);
    }
  }, [open, loadError]);

  // Populate the editor with broken JSON when the modal opens with it.
  useEffect(() => {
    if (open && brokenJson && ref.current) {
      ref.current.setValue(brokenJson);
      ref.current.getAction?.("editor.action.formatDocument")?.run();
    }
  }, [open, brokenJson]);

  const descriptionElementRef = useRef<HTMLElement>(null);

  const { actions, parse } = useServerActions();

  const getTemplateContent = useCallback(() => {
    // If the template being edited is the same as the current template,
    // get the state from LexicalEditor
    if (current.template?.ID === current.template?.ID) {
      return JSON.stringify(editor.getEditorState().toJSON(), null, 4);
    }

    return current.template?.post_content;
  }, [current.template]);

  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  const handleEditorMount = (monacoEditor: any, monaco: any) => {
    ref.current = monacoEditor;
    // If the modal was opened with broken JSON (e.g. from a failed template load),
    // populate the editor now rather than relying on defaultValue.
    if (brokenJson) {
      monacoEditor.setValue(brokenJson);
    }
    monacoEditor.getAction("editor.action.formatDocument").run();
  };

  const handleCopy = () => {
    const content = ref.current?.getValue() ?? getTemplateContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleUpdate = async () => {
    const content = ref.current?.getValue();
    setError(undefined);
    setLoading(true);

    try {
      const stringified = validateLexicalJson(content);

      // Re-process to keep cache in sync with the new editor state.
      await processAndGetTemplate(current.id!, editor, {
        editorStateString: stringified,
      });

      // If current template is same as the one being edited, update current template
      refresh();
    } catch (e) {
      logger.error("error parsing", e);
      setError(`Error parsing JSON: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent
        sx={{
          minWidth: "80%",
          maxHeight: "90%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography size="large" bold>
            {current.template?.post_title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
              <IconButton size="small" onClick={handleCopy}>
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button
              size="medium"
              loading={loading}
              onClick={handleUpdate}
              sx={{
                mr: 2,
              }}
            >
              Update
            </Button>
          </Box>
        </Box>
        <Typography
          size="medium"
          sx={{
            display: error ? "block" : "none",
            color: (theme) => theme.palette.error.main,
            my: 2,
          }}
        >
          {error}
        </Typography>

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
            defaultLanguage="json"
            defaultValue={getTemplateContent()}
            onMount={handleEditorMount}
            // onChange={handleEditorChange}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
};
