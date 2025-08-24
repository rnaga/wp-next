"use client";

import { useEffect, useRef, useState } from "react";
import { Editor as TinyMCEEditor } from "tinymce";

import { GlobalStyles, useColorScheme } from "@mui/material";
import { Editor } from "@tinymce/tinymce-react";

export const LightEditor = (
  props: Partial<{
    editorKey: any;
    onChange: (content: any, editor: any) => void;
    onClick: () => void;
    initialValue: string | undefined;
    minHeight?: number;
    maxHeight?: number;
  }>
) => {
  const {
    editorKey = "___editor_light__",
    initialValue = "",
    onChange = () => {},
    minHeight = 150,
    maxHeight = 200,
  } = props;

  const editorRef = useRef<TinyMCEEditor | null>(null);

  const { mode } = useColorScheme();
  const [content, setContent] = useState({
    key: `${Math.random()}`,
    content: "This is the initial content of the editor.",
  });

  useEffect(() => {
    if (editorRef.current) {
      setContent({
        key: `${Math.random()}`,
        content: editorRef.current.getContent(),
      });
    }
  }, [mode]);

  const handleEditorChange = (content: any, editor: any) => {
    onChange(content, editor);
  };

  useEffect(() => {
    setContent({ key: editorKey, content: initialValue });
  }, [editorKey, mode]);

  return (
    <>
      <GlobalStyles
        styles={{
          ".tox-tinymce": {
            border: "0 !important",
            borderRadius: "0 !important",
          },
        }}
      />
      <Editor
        id={`__editor_light__ ${editorKey}`}
        key={`${mode}${editorKey}`}
        licenseKey="gpl"
        tinymceScriptSrc={"/tinymce/tinymce.min.js"}
        onInit={(evt, editor) => (editorRef.current = editor)}
        onEditorChange={handleEditorChange}
        onClick={props.onClick}
        initialValue={content.content}
        init={{
          skin: mode == "dark" ? "oxide-dark" : "oxide",
          content_css: mode == "dark" ? "dark" : "default",
          menubar: false,
          min_height: minHeight,
          max_height: maxHeight,
          overflowY: "auto",
          plugins: [
            "autoresize",
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "preview",
            "help",
            "emoticons",
          ],
          toolbar1:
            "undo redo | blocks | bold italic forecolor | code | emoticons",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          branding: false,
          promotion: false,
          relative_urls: false,
          remove_script_host: false,
          autoresize_bottom_margin: 50,
          forced_root_block: "<>",
          force_br_newlines: false,
          //force_p_newlines: false,
        }}
      />
    </>
  );
};
