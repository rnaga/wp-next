import { Lock, LockOpen, TextFields } from "@mui/icons-material";
import { Box, Button, Stack, SxProps, Typography } from "@mui/material";
import type { EditorOptions } from "@tiptap/core";
import { type Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LinkBubbleMenu,
  MenuButton,
  RichTextEditor,
  TableBubbleMenu,
  type RichTextEditorRef,
} from "mui-tiptap";
import LightEditorMenuControls from "./LightEditorMenuControls";
import useExtensions from "./use-extensions";
import { MediaBubbleMenu } from "./MediaBubbleMenu";

export function LightEditor(props: {
  defaultContent?: string;
  minHeight?: number;
  maxHeight?: number;
  fontSize?: number | string;
  menuSize?: "small" | "medium" | "large";
  onUpdate?: (editor: Editor, transaction: Transaction) => void;
  onEditorReady?: (editor: Editor) => void;
  sx?: SxProps;
}) {
  const { defaultContent, minHeight, maxHeight, fontSize, menuSize, onUpdate, onEditorReady } = props;
  const extensions = useExtensions({
    placeholder: "Start typing your content here...",
  });
  const rteRef = useRef<RichTextEditorRef>(null);
  const lastDefaultContentRef = useRef<string | undefined>(defaultContent);

  // Update editor content when defaultContent prop changes
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (editor && defaultContent !== lastDefaultContentRef.current) {
      // Only update if the content is different from what's currently in the editor
      const currentContent = editor.getHTML();
      if (currentContent !== defaultContent) {
        editor.commands.setContent(defaultContent ?? "", { emitUpdate: false });
        lastDefaultContentRef.current = defaultContent;
      }
    }
  }, [defaultContent]);

  return (
    <>
      <RichTextEditor
        ref={rteRef}
        extensions={extensions}
        content={defaultContent ?? ""}
        editable={true}
        immediatelyRender={false}
        onCreate={(e) => {
          onEditorReady?.(e.editor);
        }}
        onUpdate={(e) => {
          onUpdate?.(e.editor, e.transaction);
        }}
        renderControls={() => <LightEditorMenuControls menuSize={menuSize} />}
        RichTextFieldProps={{
          variant: "outlined",
        }}
        sx={{
          minHeight: minHeight ?? 300,
          maxHeight: maxHeight ?? "calc(100vh - 200px)",
          overflowY: "auto",
          "& .MuiTiptap-FieldContainer-notchedOutline": {
            border: "none",
          },
          padding: "0 !important",
          ...(fontSize && {
            fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
            "& .ProseMirror": {
              fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
            },
            "& .ProseMirror p": {
              fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
            },
            "& .MuiTiptap-RichTextContent": {
              fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
            },
          }),
          ...props.sx,
        }}
      >
        {() => (
          <>
            <LinkBubbleMenu />
            <TableBubbleMenu />
            <MediaBubbleMenu />
          </>
        )}
      </RichTextEditor>
    </>
  );
}
