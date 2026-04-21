import { Box, SxProps } from "@mui/material";
import type { Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";
import { useRef } from "react";
import {
  LightEditor,
  stripParagraphWrap,
} from "@rnaga/wp-next-rte/tiptap/LightEditor";
import LightEditorMenuControls from "@rnaga/wp-next-rte/tiptap/LightEditorMenuControls";
import { DataInputEndDecorator } from "./DataInputEndDecorator";
import { RichtextareaMenuItems } from "./richtextarea-datainput/RichtextareaMenuItems";

export interface RichtextareaDataInputProps {
  defaultContent?: string;
  minHeight?: number;
  maxHeight?: number;
  fontSize?: number | string;
  menuSize?: "small" | "medium" | "large";
  onUpdate?: (html: string, editor: Editor, transaction: Transaction) => void;
  sx?: SxProps;
  showExpandButton?: boolean; // Show expand button in menu bar
  onExpandClick?: () => void; // Handler for expand button click
  showDataInputDecorator?: boolean; // Show data input decorator in menu bar
}

export const RichtextareaDataInput = (props: RichtextareaDataInputProps) => {
  const {
    onUpdate,
    fontSize,
    menuSize,
    sx,
    showExpandButton = true,
    onExpandClick,
    showDataInputDecorator = true,
    ...rest
  } = props;
  const editorRef = useRef<Editor | null>(null);

  const handleEditorReady = (editor: Editor) => {
    editorRef.current = editor;
  };

  const handleClick = (dataValue: string, _index?: number) => {
    if (!editorRef.current) {
      return;
    }

    const editor = editorRef.current;
    // Pipe function values (e.g. |formatDate:{"format":"YYYY-MM-DD"}) are appended
    // directly; data variables are wrapped in ${}
    const content = dataValue.startsWith("|")
      ? dataValue
      : `\${${dataValue}}`;

    // Insert the data variable at the current cursor position
    editor.chain().focus().insertContent(content).run();
  };

  const handleUpdate = (editor: Editor, transaction: Transaction) => {
    const html = stripParagraphWrap(editor.getHTML());
    onUpdate?.(html, editor, transaction);
  };

  return (
    <Box
      sx={{
        ...sx,
        position: "relative",
      }}
    >
      <LightEditor
        onUpdate={handleUpdate}
        onEditorReady={handleEditorReady}
        fontSize={fontSize}
        menuSize={menuSize}
        renderControls={() => (
          <LightEditorMenuControls
            menuSize={menuSize}
            additionalMenuItems={
              <RichtextareaMenuItems
                showExpandButton={showExpandButton}
                onExpandClick={onExpandClick}
                dataInputDecorator={
                  showDataInputDecorator ? (
                    <DataInputEndDecorator
                      onClick={handleClick}
                      showPipeFunctions
                    />
                  ) : null
                }
              />
            }
          />
        )}
        {...rest}
      />
    </Box>
  );
};
