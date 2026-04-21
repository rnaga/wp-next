import { useEffect, useMemo, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CodeEditor from "@monaco-editor/react";
import { Box } from "@mui/material";
import { MediaSelectorModal } from "@rnaga/wp-next-ui/media-selector";

import { $isEmbedNode } from "../../../lexical/nodes/embed/EmbedNode";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { NODE_PROPERTY_UPDATED } from "../../node-event";
import { Button } from "@rnaga/wp-next-ui/Button";
import { FormFlexBox, FormStyleControl } from "./Form";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HISTORY_MERGE_TAG } from "lexical";

export const EmbedModal = (props: {
  node: WPLexicalNode;
  open: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
}) => {
  const { node, open, onClose, onSubmit } = props;
  const [editor] = useLexicalComposerContext();

  const [code, setCode] = useState<string | null>(null);
  //const [openModal, setOpenModal] = useState(false);

  const ref = useRef<any>(null);

  useEffect(() => {
    if (!$isEmbedNode(node)) return;

    const code = node.getCode();

    setCode(code.length > 0 ? code : " ");
  }, [node]);

  const handleEditorMount = (editor: any, monaco: any) => {
    ref.current = editor;
    editor.getAction("editor.action.formatDocument").run();
  };

  const handleCloseModal = () => {
    //setOpenModal(false);

    onClose?.();
  };

  const handleSubmit = () => {
    if (!$isEmbedNode(node)) return;

    const content = ref.current?.getValue();
    //setOpenModal(false);

    editor.update(
      () => {
        const writable = node.getWritable();
        writable.setCode(content);
        setCode(content);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    onSubmit?.();
  };

  if (!$isEmbedNode(node) || !code) {
    return null;
  }

  return (
    <>
      <MediaSelectorModal />

      <Modal open={open} onClose={handleCloseModal}>
        <ModalContent
          sx={{
            minWidth: "40%",
            maxWidth: "60%",
            maxHeight: "90%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography size="large" bold>
            Embed
          </Typography>
          <Typography
            size="small"
            color="textSecondary"
            sx={{
              my: 2,
            }}
          >
            Enter HTML code to inject or embed into the page.
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
              height="50dvh"
              defaultLanguage="html"
              defaultValue={code}
              onMount={handleEditorMount}
              // onChange={handleEditorChange}
            />
          </Box>
          <Button size="medium" onClick={handleSubmit}>
            Submit
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};
