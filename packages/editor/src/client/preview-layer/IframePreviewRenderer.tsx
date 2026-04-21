"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { logger } from "../../lexical/logger";

import {
  $createNode,
  setEditorMode,
  setFullScreenPreviewMode,
} from "../../lexical/lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import {
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  HISTORY_MERGE_TAG,
  LexicalEditor,
} from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLexicalEditorConfig } from "../../lexical/editor";
import { registerNodeCreators } from "../../lexical/nodes";
import {
  $storeCacheData,
  CacheNode,
} from "../../lexical/nodes/cache/CacheNode";
import { getDecoratorsSync } from "../../lexical/nodes/react-decorator/client/decorator-loader";
import {
  gatherResourcesFromEditor,
  loadCustomCode,
  loadResourcesFromEditor,
} from "../../lexical/resource-loader/client";
import { processAndGetTemplateSync } from "../../lexical/template";
import { IframeMessageContext, useIframeMessage } from "../iframe-message";
import { applyBodyNodeToDocument } from "./preview-layer";
import { parseCustomCode } from "../../lexical";
import {
  restoreEditorModeConfigFromCache,
  updateNodeElementsWithEditorModeConfig,
} from "../../lexical/editor-mode-config";
import { processDebugEditorCSS } from "../../lexical/styles/css-editor";
import { NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND } from "../../lexical/commands";
import {
  applyDynamicAttributesToDocument,
  buildDynamicAttributeMap,
} from "../../lexical/nodes/data-fetching/client/reload-dynamic-values";

declare global {
  var __cachedData: Record<string, any>;
  var __rootDivId: string;
  var __editorStateJSON: Record<string, any>;
}

const Content = () => {
  const [editor] = useLexicalComposerContext();
  const nodeRegisteredRef = useRef(false);
  const { sendMessage, onMessage } = useIframeMessage();
  const [decorators, setDecorators] = useState<React.ReactNode[]>([]);

  // Reload flow: when the user clicks the reload button in the editor header,
  // the fullscreen iframe src is set to "preview?id=...&reload=1".
  // This triggers a fresh page load. On mount, we detect the reload=1 flag and
  // send REQUEST_PREVIEW_DATA to the parent window, asking it to supply the
  // current editor state. The parent (Header) responds with a PREVIEW_MODE_CHANGE
  // message containing the latest editorState, cacheData, and customCodes,
  // which the onMessage handler below uses to reconstruct the preview page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reload") === "1") {
      sendMessage({ type: "REQUEST_PREVIEW_DATA" });
    }
  }, []);

  useEffect(() => {
    onMessage((data) => {
      logger.log("Received cached data from parent:", data);
      const payload = data.payload;
      const cacheData = payload.cacheData;
      const editorStateString = JSON.stringify(payload.editorState);

      if (payload.customCodes && !Array.isArray(payload.customCodes)) {
        // payload.customCodes is Record<InjectLocation, CustomCodeList>
        const parsedCustomCode = {
          header: parseCustomCode(payload.customCodes.header ?? []),
          footer: parseCustomCode(payload.customCodes.footer ?? []),
        };
        loadCustomCode(parsedCustomCode);
      }

      // Empty editor
      editor.update(
        () => {
          $getRoot().clear();

          // Create and add CacheNode
          const cacheNode = $createNode(CacheNode);
          $getRoot().append(cacheNode);

          // Store received cache data
          $storeCacheData(cacheData);
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );

      processAndGetTemplateSync(editor, editorStateString, cacheData);

      // Restore editor mode config from cache
      restoreEditorModeConfigFromCache(editor);

      // mergeEditorModeConfig (called inside restore) only populates __editorConfig;
      // it does not translate config flags (e.g. hidden) into __stylesEditorDebug.
      // This call performs that translation so processDebugEditorCSS reads correct values.
      updateNodeElementsWithEditorModeConfig(editor);

      // Process debug editor CSS, which will trigger NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND
      processDebugEditorCSS(editor);

      const htmlString = editor.read(() =>
        $generateHtmlFromNodes(editor, null)
      );

      logger.debug("Generated HTML string:", htmlString);

      // Update root div with BodyNode content and apply BodyNode attributes to <body>
      const rootDiv = document.getElementById(globalThis.__rootDivId);
      if (rootDiv) {
        applyBodyNodeToDocument(htmlString, rootDiv, document);
      }

      // Apply dynamic attributes after the DOM is rebuilt.
      // Must run after applyBodyNodeToDocument so the target elements exist.
      // buildDynamicAttributeMap respects __editorConfig (e.g. hidden mode)
      // which was populated by updateNodeElementsWithEditorModeConfig above.
      applyDynamicAttributesToDocument(
        document,
        buildDynamicAttributeMap(editor)
      );

      const resources = gatherResourcesFromEditor(editor);

      loadResourcesFromEditor(editor);

      // Get decorators after processing
      const decorators = getDecoratorsSync({
        excludeRoot: false,
        editor,
        element: document,
      });

      setDecorators(decorators);
    });
  }, []);

  useEffect(() => {
    editor.update(
      () => {
        if (!nodeRegisteredRef.current) {
          registerNodeCreators();
          nodeRegisteredRef.current = true;
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND,
      ({ cssString }) => {
        // Remove existing debug editor styles
        const existingStyleElement = document.getElementById(
          "debug-editor-styles"
        );
        if (existingStyleElement) {
          existingStyleElement.remove();
        }

        // Inject new styles for debug editor
        const styleElement = document.createElement("style");
        styleElement.id = "debug-editor-styles";
        styleElement.innerHTML = cssString;
        document.head.appendChild(styleElement);

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return <>{decorators}</>;
};

export const IframePreviewRenderer = () => {
  const editorConfig = getLexicalEditorConfig({
    isEditing: true,
  });

  useLayoutEffect(() => {
    setEditorMode(true);
    setFullScreenPreviewMode(true);
  }, []);

  return (
    <IframeMessageContext>
      <LexicalComposer initialConfig={editorConfig as any}>
        <Content />
      </LexicalComposer>
    </IframeMessageContext>
  );
};
