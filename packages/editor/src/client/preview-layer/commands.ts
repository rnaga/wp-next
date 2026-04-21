import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import { UIEvent } from "react";
import type * as types from "../../types";
import { LexicalEditor } from "lexical";

export const PREVIEW_LAYER_LOADED_COMMAND = createActionCommand<{
  iframeWindow: NonNullable<HTMLIFrameElement["contentWindow"]>;
  iframe: HTMLIFrameElement;
}>();

// This is when loadTemplate in PreviewLayer.tsx is called and the editor is updated with the new template
export const PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND = createActionCommand<{
  editor: LexicalEditor;
  error?: string;
}>();

export const FULLSCREEN_PREVIEW_LAYER_LOADED_COMMAND = createActionCommand<{
  iframeWindow: NonNullable<HTMLIFrameElement["contentWindow"]>;
  iframe: HTMLIFrameElement;
}>();

export const PREVIEW_LAYER_STYLE_UPDATED_COMMAND = createActionCommand<{
  iframeWindow: NonNullable<HTMLIFrameElement["contentWindow"]>;
  iframe: HTMLIFrameElement;
}>();

export const PREVIEW_LAYER_UPDATED_COMMAND = createActionCommand<{
  iframeWindow: NonNullable<HTMLIFrameElement["contentWindow"]>;
  iframe: HTMLIFrameElement;
}>();

export const PREVIEW_LAYER_CONTAINER_SCROLL_COMMAND = createActionCommand<{
  event: UIEvent<HTMLDivElement, UIEvent>;
}>();

export const PREVIEW_LAYER_MODE_UPDATED_COMMAND = createActionCommand<{
  mode: "edit" | "fullscreen";
}>();

export const PREVIEW_SELECTED_COMMAND = createActionCommand<{
  previewInfo: types.TemplatePreviewInfoList[number];
}>();
