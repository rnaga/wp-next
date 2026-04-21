import { LexicalNode } from "lexical";
import { FormEventHandler, useMemo, useRef, useState } from "react";
import { logger } from "../../../lexical/logger";

import CodeEditor from "@monaco-editor/react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IosShareIcon from "@mui/icons-material/IosShare";

import { useCustomCode } from "../../custom-code/use-custom-code";
import { useTemplate } from "../../template/use-template";
import { useSelectedNode } from "../../global-event";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Button } from "@rnaga/wp-next-ui/Button";
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  SelectFreeSoloWPPost,
  SelectWPPost,
} from "@rnaga/wp-next-ui/SelectWPPost";
import { FormLabelText } from "../../forms/components";
import { formatting } from "@rnaga/wp-node/common/formatting";
import { appendCustomCodeSlug } from "../../../lexical/nodes/custom-code/CustomCodeNode";

type ExportedPost = Parameters<
  Parameters<typeof SelectFreeSoloWPPost>[0]["onChange"]
>[0];

const StyleExportModal = (props: { open: boolean; onClose: () => void }) => {
  const { open, onClose } = props;
  const [editor] = useLexicalComposerContext();
  const [exportedPost, setExportedPost] = useState<ExportedPost>();
  const [loading, setLoading] = useState(false);
  const { actions: customCodeActions } = useCustomCode();
  const { current } = useTemplate();
  const { selectedNode } = useSelectedNode();
  const [formData, setFormData] = useState({
    name: "",
    classSelector: "",
  });

  const handleCloseExport = () => {
    setLoading(false);
    setExportedPost(undefined);
    onClose();
  };

  const handleSave = (e: any) => {
    e?.preventDefault();
    if (
      !selectedNode ||
      !formData.classSelector ||
      !formData.name ||
      !current.id
    ) {
      return;
    }
    const id = exportedPost?.ID;
    const title = formData.name;
    const content = selectedNode.__css.toString({
      className: formData.classSelector,
    });

    if (!content) {
      return;
    }

    setLoading(true);

    // if customCode (post) is provided, update it
    const slug = formatting.slug(title);

    const save =
      id && id > 0
        ? customCodeActions.update(id, {
            name: title,
            slug,
            content,
          })
        : customCodeActions.create({
            name: title,
            slug,
            content: content,
            mimeType: "text/css",
          });

    save
      .then((result) => {
        // Append custom code to CustomCodeNode
        appendCustomCodeSlug(editor, "header", slug);

        // Add the class selector to the node
        selectedNode.__css.setExternalClassNames(formData.classSelector);

        // Fetch and set all custom codes tied to the current template
        customCodeActions.fetchAndSetCurrentCustomCode();
      })
      .catch((e) => {
        logger.error("error saving", e);
      })
      .finally(() => {
        handleCloseExport();
      });
  };

  return (
    <Modal open={open} onClose={handleCloseExport}>
      <ModalContent
        sx={{
          width: "20%",
          minWidth: 300,
        }}
      >
        <Typography
          size="large"
          bold
          sx={{
            mb: 2,
          }}
        >
          Export
        </Typography>
        <form onSubmit={handleSave}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 1,
            }}
          >
            <FormControl>
              <FormLabelText size="medium" label="Name" />

              {exportedPost && exportedPost.ID > 0 && (
                <Typography color="error" size="small">
                  You are about to overwrite the existing custom code.
                </Typography>
              )}
              <SelectFreeSoloWPPost
                size="medium"
                onChange={(post) => {
                  setExportedPost(post);
                  setFormData({
                    ...formData,
                    name: post.post_title,
                  });
                }}
                postArgs={{
                  meta: { key: "mime_type", value: "text/css" },
                }}
                postOptions={{
                  postTypes: ["next-custom-code"],
                  context: "edit",
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabelText size="medium" label="CSS Class Name" />
              <Input
                size="medium"
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    classSelector: value,
                  });
                }}
              />
            </FormControl>

            <Button
              type="submit"
              size="medium"
              loading={loading}
              sx={{
                mt: 1,
              }}
            >
              Submit
            </Button>
          </Box>
        </form>
      </ModalContent>
    </Modal>
  );
};

export const StyleViewer = (props: { open: boolean; onClose: () => void }) => {
  const { open, onClose } = props;
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [openExport, setOpenExport] = useState(false);
  const [contentCopied, setContentCopied] = useState(false);

  const ref = useRef<any>(undefined);

  if (!selectedNode) {
    return null;
  }

  const cssString = editor
    //.getEditorState()
    .read(() => {
      try {
        return selectedNode.getLatest().__css.toString();
      } catch {
        return "";
      }
    });

  const handleEditorMount = (editor: any, monaco: any) => {
    ref.current = editor;
    const tryFormat = () => {
      const action = editor.getAction("editor.action.formatDocument");
      if (action) {
        action.run().then(() => {
          editor.updateOptions({ readOnly: true });
        });
      } else {
        requestAnimationFrame(tryFormat);
      }
    };
    requestAnimationFrame(tryFormat);
  };

  return (
    <>
      <StyleExportModal
        open={openExport}
        onClose={() => setOpenExport(false)}
      />

      <Modal open={open} onClose={onClose}>
        <ModalContent
          sx={{
            minWidth: "80%",
            maxWidth: "95%",
          }}
        >
          <Typography size="large" bold>
            CSS Viewer
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "right",
                gap: 1,
              }}
            >
              <Tooltip title="Export to Custom Code" placement="top">
                <IconButton>
                  <IosShareIcon
                    onClick={() => {
                      setOpenExport(true);
                    }}
                  />
                </IconButton>
              </Tooltip>
              {contentCopied ? (
                <CheckIcon />
              ) : (
                <Tooltip title="Copy to clipboard" placement="top">
                  <IconButton
                    onClick={() => {
                      setContentCopied(true);
                      navigator.clipboard.writeText(cssString);
                      setTimeout(() => {
                        setContentCopied(false);
                      }, 1000);
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box>
              <CodeEditor
                //key={listItems.map((customCode) => customCode.ID).join(",")}
                // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
                options={{
                  padding: { bottom: 0 },
                  autoIndent: "advanced",
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                height="70dvh"
                defaultLanguage="css"
                defaultValue={cssString}
                onMount={handleEditorMount}
              />
            </Box>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};
