import { Lock, LockOpen, TextFields } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { EditorOptions } from "@tiptap/core";
import { type Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";
import { useCallback, useRef, useState } from "react";
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
  onUpdate?: (editor: Editor, transaction: Transaction) => void;
}) {
  const { defaultContent, minHeight, maxHeight, onUpdate } = props;
  const extensions = useExtensions({
    placeholder: "Start typing your content here...",
  });
  const rteRef = useRef<RichTextEditorRef>(null);

  return (
    <>
      <RichTextEditor
        ref={rteRef}
        extensions={extensions}
        content={defaultContent ?? ""}
        editable={true}
        immediatelyRender={false}
        onUpdate={(e) => {
          onUpdate?.(e.editor, e.transaction);
        }}
        renderControls={() => <LightEditorMenuControls />}
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
