import { EditorConfig, LexicalEditor } from "lexical";
import { isServerSide } from "./environment";

export let isLexicalEditorMode = false;

/**
 * Sets the global editor mode flag.
 *
 * CLIENT-SIDE ONLY when enabling editor mode (mode = true). This flag is a
 * module-level global shared across all requests in a Node.js server process.
 * Enabling it on the server would corrupt state for concurrent requests.
 * Passing `false` on the server is safe and is a no-op (the default is false).
 */
export const setEditorMode = (mode: boolean) => {
  if (mode && isServerSide()) {
    throw new Error(
      "setEditorMode(true) must only be called on the client side. " +
        "Enabling editor mode on the server mutates a shared global and corrupts state across requests."
    );
  }
  isLexicalEditorMode = mode;
};

export let isFullScreenPreviewMode = false;

/**
 * Sets the global full-screen preview mode flag.
 *
 * CLIENT-SIDE ONLY when enabling preview mode (mode = true). This flag is a
 * module-level global shared across all requests in a Node.js server process.
 * Enabling it on the server would corrupt state for concurrent requests.
 * Passing `false` on the server is safe and is a no-op (the default is false).
 */
export const setFullScreenPreviewMode = (mode: boolean) => {
  if (mode && isServerSide()) {
    throw new Error(
      "setFullScreenPreviewMode(true) must only be called on the client side. " +
        "Enabling full-screen preview mode on the server mutates a shared global and corrupts state across requests."
    );
  }
  isFullScreenPreviewMode = mode;
};

// True if the editor is in editor mode
export const isEditorMode = (
  editorOrEditorConfig?: LexicalEditor | EditorConfig
) => {
  if (!editorOrEditorConfig) {
    return isLexicalEditorMode;
  }

  const config = (editorOrEditorConfig as any)._config || editorOrEditorConfig;
  return config.namespace === "editor";
};
