import { Box } from "@mui/material";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import type { Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";

import { RichtextareaDataInput } from "../../../../client/forms/components/RichtextareaDataInput";

interface DraggableTemplateEditorProps {
  defaultContent?: string;
  onUpdate?: (html: string, editor: Editor, transaction: Transaction) => void;
  open?: boolean;
  onClose?: () => void;
  portalTarget?: HTMLElement | null;
}

export const DraggableTemplateEditor = (
  props: DraggableTemplateEditorProps
) => {
  const { defaultContent, onUpdate, open = false, onClose, portalTarget } =
    props;

  return (
    <DraggableBox
      open={open}
      onClose={onClose || (() => {})}
      portalTarget={portalTarget}
      title="Template Editor"
      size="medium"
      resizable={true}
      sx={{
        minWidth: 400,
        maxWidth: "50vw",
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <RichtextareaDataInput
          fontSize={12}
          minHeight={350}
          menuSize="small"
          defaultContent={defaultContent}
          onUpdate={onUpdate}
          showExpandButton={false}
          showDataInputDecorator={true}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            "& .MuiTiptap-RichTextEditor-root": {
              flex: 1,
              display: "flex",
              flexDirection: "column",
            },
          }}
        />
      </Box>
    </DraggableBox>
  );
};
