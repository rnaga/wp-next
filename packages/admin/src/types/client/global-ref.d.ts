import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";

declare module "@rnaga/wp-next-core/types/client" {
  export interface GlobalRef {
    "tinymce-editor": TinyMCEEditor["editor"];
  }
}
