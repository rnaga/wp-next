import { Lock, LockOpen, TextFields } from "@mui/icons-material";
import { Box, Button, Stack, SxProps, Typography } from "@mui/material";
import type { EditorOptions } from "@tiptap/core";
import { type Editor } from "@tiptap/core";
import { Transaction } from "@tiptap/pm/state";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Strips wrapping `<p>` tag when the entire content is a single paragraph.
 *
 * TipTap/ProseMirror always wraps text in a `<p>` block node by design.
 * Use this to get clean HTML output without the outer `<p>` wrapper.
 *
 * Only strips when content is a single paragraph — multi-paragraph content
 * (e.g. `<p>first</p><p>second</p>`) is returned as-is.
 *
 * @example
 * ```ts
 * import { stripParagraphWrap } from "@rnaga/wp-next-rte/tiptap/LightEditor";
 *
 * // In LightEditor's onUpdate callback:
 * onUpdate={(editor) => {
 *   const html = stripParagraphWrap(editor.getHTML());
 *   // "<p>Hello <strong>world</strong></p>" → "Hello <strong>world</strong>"
 *   // "<p>first</p><p>second</p>" → "<p>first</p><p>second</p>" (unchanged)
 * }}
 * ```
 */
export function stripParagraphWrap(html: string): string {
  if (
    html.startsWith("<p>") &&
    html.endsWith("</p>") &&
    html.indexOf("<p>", 1) === -1
  ) {
    return html.slice(3, -4);
  }
  return html;
}

export function LightEditor(props: {
  defaultContent?: string;
  minHeight?: number;
  maxHeight?: number;
  fontSize?: number | string;
  menuSize?: "small" | "medium" | "large";
  onUpdate?: (editor: Editor, transaction: Transaction) => void;
  onEditorReady?: (editor: Editor) => void;
  sx?: SxProps;
  renderControls?: () => ReactNode;
}) {
  const { defaultContent, minHeight, maxHeight, fontSize, menuSize, onUpdate, onEditorReady, renderControls } = props;
  const extensions = useExtensions({
    placeholder: "Start typing your content here...",
  });
  const rteRef = useRef<RichTextEditorRef>(null);
  const lastDefaultContentRef = useRef<string | undefined>(defaultContent);

  // Update editor content when defaultContent prop changes
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (editor && defaultContent !== lastDefaultContentRef.current) {
      // Normalize both sides so that stripped "<p>" content matches the editor's wrapped output
      const currentContent = stripParagraphWrap(editor.getHTML());
      const incoming = stripParagraphWrap(defaultContent ?? "");
      if (currentContent !== incoming) {
        // Use queueMicrotask to defer the update and avoid flushSync warning
        queueMicrotask(() => {
          editor.commands.setContent(defaultContent ?? "", { emitUpdate: false });
        });
      }
      lastDefaultContentRef.current = defaultContent;
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
        renderControls={renderControls || (() => <LightEditorMenuControls menuSize={menuSize} />)}
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
