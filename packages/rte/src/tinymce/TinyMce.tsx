"use client";

import { useEffect, useRef, useState } from "react";
import { Editor as TinyMCEEditor } from "tinymce";

import { GlobalStyles, useColorScheme } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useMediaSelector } from "@rnaga/wp-next-ui/hooks/use-media-selector";
import { Editor } from "@tinymce/tinymce-react";

export const TinyMce = (
  props: Partial<{
    editorKey: any;
    onChange: (content: any, editor: any) => void;
    initialValue: string | undefined;
  }>
) => {
  const {
    editorKey = "___editor___",
    initialValue = "",
    onChange = () => {},
  } = props;

  const { globalRef } = useWP();
  const mediaSelector = useMediaSelector();

  const editorRef = useRef<TinyMCEEditor | null>(null);

  const { mode, setMode } = useColorScheme();
  const [content, setContent] = useState({
    key: `${Math.random()}`,
    content: "<p>This is the initial content of the editor.</p>",
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
    // console.log(mode);
    //console.log("Content was updated:", content);
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
        id="__editor__"
        key={`${mode}${editorKey}`}
        licenseKey="gpl"
        tinymceScriptSrc={"/tinymce/tinymce.min.js"}
        onInit={(evt, editor) => (editorRef.current = editor)}
        onEditorChange={handleEditorChange}
        // onDeactivate={() => {
        //   set("tinymce-editor", undefined);
        // }}
        initialValue={content.content}
        init={{
          skin: mode == "dark" ? "oxide-dark" : "oxide",
          content_css: mode == "dark" ? "dark" : "default",
          height: 600,
          max_height: 1000,
          //menubar: false,
          // images_upload_handler: async (blobInfo, progress) => {
          //   console.log(`blobInfo`, blobInfo, progress);

          //   return "http://localhost3000";
          // },
          plugins: [
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
            "wordcount",
            "emoticons",
          ],
          toolbar1:
            "undo redo | blocks " +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "table | image | media" +
            " | searchreplace | code | emoticons | fullscreen | media-library ",
          // toolbar2:
          //   "table | tablecellprops | tablecopyrow | tablecutrow | tabledelete ", // tabledelete tabledeletecol tabledeleterow tableinsertdialog tableinsertcolafter tableinsertcolbefore tableinsertrowafter tableinsertrowbefore tablemergecells tablepasterowafter tablepasterowbefore tableprops tablerowprops tablesplitcells tableclass tablecellclass tablecellvalign tablecellborderwidth tablecellborderstyle tablecaption tablecellbackgroundcolor tablecellbordercolor tablerowheader tablecolheader'
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          automatic_uploads: true,
          branding: false,
          promotion: false,
          setup: function (editor: any) {
            globalRef.set("tinymce-editor", editor);
            editor.ui.registry.addButton("media-library", {
              icon: "gallery",
              text: "Media Library",
              tooltip: "Insert Attachment",
              onAction: () => {
                mediaSelector.open((post) => {
                  editor.insertContent(`<img src="${post.guid}" />`);
                });
              },
            });
          },
          document_base_url: "http://localhost:3000",
          relative_urls: false,
          remove_script_host: false,
        }}
      />
    </>
  );
};
