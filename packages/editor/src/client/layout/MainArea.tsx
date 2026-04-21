import { COMMAND_PRIORITY_HIGH, LexicalEditor, LexicalNode } from "lexical";
import { UIEvent, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import {
  EDITOR_MODE_CONFIG_UPDATED_COMMAND,
  NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND,
  NODE_EDITOR_CSS_UPDATED_COMMAND,
} from "../../lexical/commands";
import { updateNodeElementsWithEditorModeConfig } from "../../lexical/editor-mode-config";
import {
  NODE_CSS_VARIABLES_DATA_UPDATED_COMMAND,
  NODE_CSS_VARIABLES_FETCHED_COMMAND,
} from "../../lexical/nodes/css-variables/commands";
import { $isCSSVariablesNode } from "../../lexical/nodes/css-variables/CSSVariablesNode";
import {
  applyDynamicAttributesToDocument,
  buildDynamicAttributeMap,
} from "../../lexical/nodes/data-fetching/client/reload-dynamic-values";
import { DATA_FETCHING_NODE_FETCHED_COMMAND } from "../../lexical/nodes/data-fetching/commands";
import { useGoogleFonts } from "../../lexical/nodes/font/client/use-google-fonts";
import { NODE_CUSTOM_FONT_UPDATED } from "../../lexical/nodes/font/commands";
import {
  $getCustomFontCSS,
  $isCustomFontNode,
} from "../../lexical/nodes/font/CustomFontNode";
import {
  $getGoogleFontNode,
  buildGoogleFontsStyleLink,
  getGoogleFonts,
} from "../../lexical/nodes/font/GoogleFontNode";
import { END_PROCESS_ALL_WIDGET } from "../../lexical/nodes/widget/WidgetNode";
import { cssToStringFromEditor } from "../../lexical/styles-core/css";
import { generateKeyframeCSSAndJS } from "../../lexical/styles/animation";
import {
  processDebugEditorCSS,
  processEditorCSS,
} from "../../lexical/styles/css-editor";
import { insertWeakStyles } from "../../lexical/styles/weak-css";
import { WP_BREAKPOINT_DEVICE_CHANGED_COMMAND } from "../breakpoint/commands";
import { addWPHooksActionCommands, trackEventEnd } from "../event-utils";
import { openRootContextMenu } from "../keys-menu";
import { CanvasArea } from "../mouse-tool/CanvasArea";
import {
  WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND,
  WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND,
} from "../mouse-tool/commands";
import { MouseTool } from "../mouse-tool/MouseTool";
import {
  NODE_CREATED_COMMAND,
  NODE_DESTROYED_COMMAND,
  NODE_PROPERTY_UPDATED,
  NODE_UPDATED_COMMAND,
} from "../node-event";
import {
  PREVIEW_LAYER_CONTAINER_SCROLL_COMMAND,
  PreviewLayer,
  usePreviewLayer,
} from "../preview-layer";
import { PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND } from "../preview-layer/commands";
import { FullScreenPreviewLayer } from "../preview-layer/FullScreenPreviewLayer";
import { CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND } from "../right-panel-form/commands";
import { useElementState } from "../right-panel-form/ElementStateContext";
import {
  MAIN_AREA_LOADED_CLICKED_COMMAND,
  MAIN_AREA_LOADED_COMMAND,
} from "./commands";
import { ErrorMessage } from "./ErrorMessage";

const Style = () => {
  const [editor] = useLexicalComposerContext();
  const { iframeRef } = usePreviewLayer();
  const [styles, setStyles] = useState<string>();

  const [debugEditorStyles, setDebugEditorStyles] = useState<string>();

  const [animationStyle, setAnimationStyle] = useState<string>();
  const [animationScript, setAnimationScript] = useState<string>();
  const animationScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const old = document.getElementById("animation-script");
    if (old) old.remove();

    if (animationScript) {
      const el = document.createElement("script");
      el.id = "animation-script";
      el.type = "text/javascript";
      el.textContent = animationScript;
      document.head.appendChild(el);
      animationScriptRef.current = el;
    }
  }, [animationScript]);

  const [widgetStyle, setWidgetStyle] = useState<string>();
  //const [injectedStyle, setInjectedStyle] = useState<string>();
  const { elementState } = useElementState();
  const { wpHooks } = useWP();

  const updateStyle = (args?: {
    node?: LexicalNode;
    targetEditor?: LexicalEditor;
  }) => {
    const styling = cssToStringFromEditor(editor);
    setStyles(styling);
  };

  const updateAnimationScript = () => {
    const { js: animationJSArray, css: animationCSSArray } =
      generateKeyframeCSSAndJS(editor);
    const animationScript = animationJSArray.join("\n");
    const animationStyle = animationCSSArray.join("\n");
    setAnimationScript(animationScript);
    setAnimationStyle(animationStyle);
  };

  useEffect(() => {
    const removeCommands: VoidFunction[] = [];
    for (const command of [
      NODE_UPDATED_COMMAND,
      NODE_CREATED_COMMAND,
      NODE_DESTROYED_COMMAND,
      //NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND,
      NODE_CSS_VARIABLES_FETCHED_COMMAND,
    ]) {
      removeCommands.push(
        editor.registerCommand(
          command,
          (args) => {
            updateStyle();
            updateAnimationScript();
            processEditorCSS(editor);
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    }

    return () => {
      for (const removeCommand of removeCommands) {
        removeCommand();
      }
    };
  }, []);

  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [
        CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND,
        WP_BREAKPOINT_DEVICE_CHANGED_COMMAND,
      ],
      () => {
        updateStyle();
        updateAnimationScript();
        processEditorCSS(editor);
      }
    );
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      // Triggered when widget is processed
      END_PROCESS_ALL_WIDGET,
      ({ nestedEditors }) => {
        let styling = "";
        nestedEditors.forEach((nestedEditor) => {
          styling += cssToStringFromEditor(nestedEditor);
        });
        setWidgetStyle(styling);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      NODE_EDITOR_CSS_UPDATED_COMMAND,
      ({ cssProperties }) => {
        if (iframeRef.current?.contentDocument) {
          insertWeakStyles(
            cssProperties as any,
            iframeRef.current.contentDocument
          );
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND,
      ({ cssString }) => {
        if (iframeRef.current?.contentDocument) {
          setDebugEditorStyles(cssString);
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  useEffect(() => {
    // This triggers when editor mode config is updated.
    // e.g. when hidden mode is toggled in TreeNavigator.
    return editor.registerCommand(
      EDITOR_MODE_CONFIG_UPDATED_COMMAND,
      (payload) => {
        setTimeout(() => {
          updateNodeElementsWithEditorModeConfig(editor, {
            mappedConfig: payload.mappedConfig,
          });

          processDebugEditorCSS(editor);
        });
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return (
    <>
      <style id="animation-style">{animationStyle}</style>
      {styles && <style>{styles}</style>}
      {debugEditorStyles && <style>{debugEditorStyles}</style>}
      <style>
        {/* Widget styles */}
        {widgetStyle}
      </style>
    </>
  );
};

/**
 * Injects or updates the Google Fonts <link> in the iframe HEAD.
 * Reads the current font URL directly from the editor so it is always fresh,
 * regardless of React state timing.
 */
const injectGoogleFontLink = (
  editor: LexicalEditor,
  iframeRef: { current: HTMLIFrameElement | null }
) => {
  const iframeHead = iframeRef.current?.contentDocument?.head;

  if (!iframeHead) {
    return;
  }

  const googleFontNode = editor.read(() => {
    try {
      return $getGoogleFontNode(editor);
    } catch {
      return null;
    }
  });

  if (!googleFontNode) {
    return;
  }

  const currentLink = buildGoogleFontsStyleLink(getGoogleFonts(editor));
  const existing = iframeHead.querySelector("link[data-google-fonts]");

  if (!currentLink) {
    existing?.remove();
    return;
  }

  if (existing instanceof HTMLLinkElement && existing.href === currentLink) {
    return;
  }

  const linkEl = iframeRef.current!.contentDocument!.createElement("link");
  linkEl.rel = "stylesheet";
  linkEl.href = currentLink;
  linkEl.setAttribute("data-google-fonts", "true");
  iframeHead.appendChild(linkEl);
};

const Font = () => {
  const [editor] = useLexicalComposerContext();
  const { iframeRef } = usePreviewLayer();
  const { link } = useGoogleFonts();
  const { wpHooks } = useWP();
  const [customFontCSS, setCustomFontCSS] = useState<string>();

  useEffect(() => {
    return editor.registerCommand(
      NODE_CUSTOM_FONT_UPDATED,
      ({ node }) => {
        const css = $getCustomFontCSS();
        setCustomFontCSS(css);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      DATA_FETCHING_NODE_FETCHED_COMMAND,
      ({ node }) => {
        if ($isCustomFontNode(node)) {
          const css = $getCustomFontCSS();
          setCustomFontCSS(css);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  // Inject Google Fonts link into the iframe HEAD so the browser starts loading
  // fonts before content renders. Injecting into the body (the old approach)
  // caused the font link to load after initial paint, so the browser applied the
  // fallback font first and may not re-apply the correct variant.
  //
  // Also re-injects when a template finishes loading: loadTemplate injects the
  // link before calling setInnerHTML on the head, but setInnerHTML removes
  // everything after its marker comment — which can include the font link when
  // the marker already exists from a prior load.
  useEffect(() => {
    injectGoogleFontLink(editor, iframeRef);
    return wpHooks.action.addCommand(
      PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND,
      () => {
        injectGoogleFontLink(editor, iframeRef);
      }
    );
  }, [link, iframeRef.current?.contentDocument?.head]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ type }) => {
        if (type !== "mouse") {
          trackEventEnd(
            "node-css-updated",
            () => {
              injectGoogleFontLink(editor, iframeRef);
            },
            500
          );
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [link, iframeRef.current?.contentDocument?.head]);

  return <>{customFontCSS && <style>{customFontCSS}</style>}</>;
};

const CSSVariables = () => {
  const [editor] = useLexicalComposerContext();
  const [cssVariablesCSS, setCSSVariablesCSS] = useState<string>();

  useEffect(() => {
    const removeCommands: ReturnType<typeof editor.registerCommand>[] = [];
    for (const command of [
      NODE_CSS_VARIABLES_FETCHED_COMMAND,
      NODE_CSS_VARIABLES_DATA_UPDATED_COMMAND,
    ]) {
      removeCommands.push(
        editor.registerCommand(
          command,
          ({ node }) => {
            setCSSVariablesCSS(node.getData()?.css);
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    }

    return () => {
      for (const removeCommand of removeCommands) {
        removeCommand();
      }
    };
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      DATA_FETCHING_NODE_FETCHED_COMMAND,
      ({ node }) => {
        if ($isCSSVariablesNode(node)) {
          setCSSVariablesCSS(node.getData()?.css);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return !cssVariablesCSS ? null : <style>{cssVariablesCSS}</style>;
};

/**
 * Mirrors the DynamicAttributes hidden-mode state to the PreviewLayer iframe
 * when editor mode config changes (e.g. hide toggle in DynamicAttributesForm).
 *
 * Listens for EDITOR_MODE_CONFIG_UPDATED_COMMAND (same as Style does for CSS),
 * then rebuilds the dynamic-attribute map from the current editor state — which
 * already reflects the updated __editorConfig after updateNodeElementsWithEditorModeConfig
 * runs in Style's handler — and patches the iframe's contentDocument directly.
 *
 * Only targets the PreviewLayer iframe. The FullPreviewLayer (IframePreviewRenderer)
 * handles its own application when it receives the editor state via postMessage.
 */
const DynamicAttributesMode = () => {
  const [editor] = useLexicalComposerContext();
  const { iframeRef } = usePreviewLayer();

  useEffect(() => {
    return editor.registerCommand(
      EDITOR_MODE_CONFIG_UPDATED_COMMAND,
      (payload) => {
        // Defer until after Style's handler has called updateNodeElementsWithEditorModeConfig,
        // which merges __editorConfig into each node's DynamicAttributes instance.
        // Both components use setTimeout so their callbacks are queued in registration
        // order — Style registers first (mounted first in JSX), so its update runs
        // before this map build.
        setTimeout(() => {
          const dynamicAttributeMap = buildDynamicAttributeMap(editor);
          applyDynamicAttributesToDocument(
            iframeRef.current?.contentDocument,
            dynamicAttributeMap
          );
        });
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return null;
};

export const MainArea = (props: { children: React.ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  const { mainAreaRef, previewMode } = usePreviewLayer();
  const scrollAtTheBottom = useRef(false);

  return (
    <CanvasArea>
      <Box
        sx={{
          position: "relative",
        }}
      >
        <Box
          id="preview-layer-container"
          ref={(ref: HTMLDivElement | null) => {
            if (!ref) {
              return;
            }
            // WORKAROUND: Setting mainAreaRef.current directly here because
            // MAIN_AREA_LOADED_COMMAND fires before PreviewLayerContext's useEffect
            // can register a handler (ref callbacks run during render, effects run after).
            mainAreaRef.current = ref;
            wpHooks.action.doCommand(MAIN_AREA_LOADED_COMMAND, {
              mainArea: ref,
            });
          }}
          sx={{
            transformOrigin: "top left",
            // overflow is managed imperatively by useCanvasPan:
            //   wheel mode on  → "visible" (full-height iframe not clipped, panning reveals content)
            //   wheel mode off → "auto"    (restores normal scrolling)
            // Default "visible" matches the initial enabled state of wheel mode.
            overflow: "visible",
            display: "flex",
            position: "absolute",
            justifyContent: "center",
          }}
          onScroll={(event) => {
            wpHooks.action.doCommand(PREVIEW_LAYER_CONTAINER_SCROLL_COMMAND, {
              event: event as unknown as UIEvent<HTMLDivElement, UIEvent>,
            });

            // Check and trigger scroll on bottom
            const target = event.target as HTMLDivElement;
            const { scrollTop, scrollHeight, clientHeight } = target;

            if (!scrollTop || !scrollHeight || !clientHeight) {
              return;
            }

            const isAtTheBottom = scrollTop + clientHeight >= scrollHeight - 10;

            if (isAtTheBottom && !scrollAtTheBottom.current) {
              scrollAtTheBottom.current = true;
              wpHooks.action.doCommand(
                WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND,
                {}
              );
            }

            if (!isAtTheBottom && scrollAtTheBottom.current) {
              scrollAtTheBottom.current = false;
              wpHooks.action.doCommand(
                WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND,
                {}
              );
            }
          }}
          onClick={() => {
            wpHooks.action.doCommand(
              MAIN_AREA_LOADED_CLICKED_COMMAND,
              undefined
            );
          }}
        >
          <PreviewLayer>
            <Font />
            <CSSVariables />
            <Style />
            <DynamicAttributesMode />
            {props.children}
          </PreviewLayer>
          <FullScreenPreviewLayer />

          {/* Fullscreen mode intentionally reuses PreviewLayer's iframe.
              Avoid mounting FullScreenPreviewLayer to prevent route-level reloads. */}
        </Box>

        <Box
          onContextMenu={(e) => {
            e.preventDefault();
            openRootContextMenu(editor, e);
          }}
          id="canvas-box"
          sx={{
            width: "100%",
            height: "100%",
            position: "absolute",
            left: 0,
            top: 0,
            transform: "none",
            // Use display:none (not visibility:hidden) so that child elements with
            // explicit visibility:visible (e.g. the toolbox overlay) cannot bleed through.
            // visibility:hidden is inherited but overridable by children; display:none is not.
            display: previewMode === "edit" ? "block" : "none",
          }}
        >
          <MouseTool />
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
          }}
        >
          <ErrorMessage />
        </Box>
      </Box>
    </CanvasArea>
  );
};
