import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, preload } from "react-dom";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import {
  generateCustomCode,
  parseCustomCode,
  resetEditor,
  setInnerHTML,
} from "../../lexical";
import {
  getDecorators,
  processAndGetDecoratorsInWidgets,
} from "../../lexical/nodes/react-decorator/client/decorator-loader";
import { processAndGetTemplateInPreviewMode } from "../../lexical/template";
import { useBreakpoint } from "../breakpoint";
import {
  WP_BREAKPOINT_CHANGED_COMMAND,
  WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
} from "../breakpoint/commands";

import { useTemplate } from "../template";
import {
  type IframeAutoResize,
  resizeIframeHeight,
  resetIframeHeight,
  setupIframeAutoResize,
  usePreviewLayer,
} from "./preview-layer";
import {
  PREVIEW_LAYER_LOADED_COMMAND,
  PREVIEW_LAYER_STYLE_UPDATED_COMMAND,
  PREVIEW_LAYER_UPDATED_COMMAND,
  PREVIEW_SELECTED_COMMAND,
  PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND,
} from "./commands";
import {
  CANVAS_SCROLL_COMMAND,
  CANVAS_WHEEL_MODE_CHANGED_COMMAND,
  CANVAS_ZOOMING_COMMAND,
} from "../mouse-tool/commands";
import {
  $getNodeByKey,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_HIGH,
  HISTORY_MERGE_TAG,
} from "lexical";
import { TEMPLATE_ID_UPDATED } from "../template/commands";
import { addLexicalCommands, trackEventEnd } from "../event-utils";
import { NODE_UPDATED_COMMAND } from "../node-event";
import { $emptyCacheData } from "../../lexical/nodes/cache/CacheNode";
import { useCustomCode } from "../custom-code";
import {
  processEditorCSS,
  setEditorCSS,
} from "../../lexical/styles/css-editor";
import { CUSTOM_CODE_FETCHED_AND_UPDATED } from "../custom-code/commands";
import { $getBodyNode } from "../../lexical/nodes/body/BodyNode";

// Provider component for iframe events
export const PreviewLayer = ({
  children,
  ...propsRest
}: {
  children: React.ReactNode;
  iframeProps?: any[];
}) => {
  const [iframeState, setIframeState] = useState<HTMLIFrameElement | null>(
    null
  );
  const previewLayer = usePreviewLayer();

  useEffect(() => {
    previewLayer.iframeRef.current = iframeState;
  }, [iframeState]);

  return (
    <Container
      iframeState={iframeState}
      setIframeState={setIframeState}
      {...propsRest}
    >
      {children}
    </Container>
  );
};

// Container component for the iframe
const Container = ({
  children,
  iframeState,
  setIframeState,
  ...propsRest
}: {
  children: React.ReactNode;
  iframeState: HTMLIFrameElement | null;
  setIframeState: (ref: HTMLIFrameElement) => void;
  iframeProps?: any[];
}) => {
  const [contentWindow, body] = useMemo(() => {
    if (!iframeState) return [null, null];
    return [iframeState.contentWindow, iframeState.contentDocument?.body];
  }, [iframeState]);

  const { setScaleByEvent } = useBreakpoint();
  const { previewMode, updatePreviewIframeOffset } = usePreviewLayer();
  const previewModeRef = useRef(previewMode);
  previewModeRef.current = previewMode;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const autoResizeRef = useRef<IframeAutoResize | null>(null);
  const isIframeLoaded = useRef(false);

  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const {
    current: currentTemplate,
    openSelectModal,
    openJsonViewModal,
    setSelectedPreview,
    isCurrentStateSyncedWithSavedState,
  } = useTemplate();

  const {
    getPixelBreakpoint,
    setFittedScale,
    breakpointRef,
    getScaledDVHlHeight,
    setHeight,
  } = useBreakpoint();

  const { current: currentCustomCode } = useCustomCode();
  const [reactDecorators, setReactDecorators] = useState<
    ReturnType<typeof createPortal>[]
  >([]);

  const loadTemplate = async (templateId: number, previewInfoKey?: string) => {
    if (
      !iframeState ||
      !iframeState.contentWindow ||
      !body?.innerHTML //||
      //loaded
    ) {
      return;
    }

    // CRITICAL: Clear all cached data before loading a new template.
    // processAndGetTemplate inherits cache data to optimize rendering, but when switching templates,
    // stale cache from the previous template can cause incorrect rendering or data inconsistencies.
    // This ensures each template starts with a clean cache state.
    editor.update(
      () => {
        $emptyCacheData();
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );

    // And also ensure to clear history stack when switching templates to prevent undoing into a different template's state
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);

    try {
      const result = await processAndGetTemplateInPreviewMode(
        templateId,
        editor,
        previewInfoKey
      );

      if (!result.valid) {
        if (result.brokenJson) {
          // JSON is syntactically or structurally invalid — open the JSON editor
          // so the user can see and fix the broken content.
          openJsonViewModal(
            result.brokenJson,
            `Failed to parse template JSON: ${result.error ?? "Invalid JSON"}`
          );
          wpHooks.action.doCommand(PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND, {
            editor,
          });
        } else {
          // Template not found or other unrecoverable error — fall back to selection.
          queueMicrotask(() => openSelectModal());
        }
        return;
      }

      const { previewInfo, editorStateString, editorStateKey } = result;

      // Clear old decorator portals and yield a macrotask so React commits the
      // empty state before setInnerHTML replaces iframe DOM nodes. Without this,
      // React tries to removeChild portal nodes that no longer exist in the DOM.
      setReactDecorators([]);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Update preview editor state string
      setSelectedPreview({
        editorStateString,
        editorStateKey,
        previewInfo,
      });

      // Store parsed custom code in state for later to send it to FullScreenPreview
      if (result.preload.customCodes) {
        currentCustomCode.setAll(result.preload.customCodes);
      }

      const reactDecorators = await getDecorators({
        excludeRoot: true,
        editor,
        preload: result.preload,
        element: iframeState?.contentWindow?.document,
      });

      const customCodes = result.preload.customCodes ?? {
        header: [],
        footer: [],
      };

      const headerContent = generateCustomCode(customCodes.header ?? []);
      const footerContent = generateCustomCode(customCodes.footer ?? []);

      // Inject Google Fonts link into iframe HEAD before body content so the
      // browser can begin loading fonts before content renders. If we let the
      // Font component inject it via createPortal into the body, the link loads
      // after content is already rendered and the browser may not re-apply the
      // correct font variant on initial paint.
      const iframeHead = iframeState.contentWindow.document.head;
      const existingFontLink = iframeHead.querySelector(
        "link[data-google-fonts]"
      );
      if (existingFontLink) {
        existingFontLink.remove();
      }

      if (result.googleFontLink) {
        const linkEl = iframeState.contentWindow.document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = result.googleFontLink;
        linkEl.setAttribute("data-google-fonts", "true");
        iframeHead.appendChild(linkEl);
      }

      setInnerHTML(
        iframeState.contentWindow.document.head,
        headerContent,
        "header"
      );
      setInnerHTML(
        iframeState.contentWindow.document.body,
        footerContent,
        "footer"
      );

      currentTemplate.set({
        template: result.template,
        widgetSlugs: result.widgetSlugs,
      });

      setReactDecorators(reactDecorators);

      // TODO: Re-enable once BodyNode.getEditorCSS() is implemented (see BodyNode.tsx).
      // Intended to set editor-only width/height on BodyNode so it fills the iframe canvas,
      // making it easily selectable on mouse-over. Disabled because setEditorCSS() has no effect
      // without the getEditorCSS() override in BodyNode that merges dynamic styles into
      // processEditorCSS — which in turn requires PreviewLayer to forward BodyNode attributes
      // to the real <body> element in the iframe.
      //const bodyNode = editor.read(() => $getBodyNode());
      // setEditorCSS(editor, bodyNode, {
      //   width: `${iframeState.offsetWidth}px`,
      //   height: `${iframeState.offsetHeight}px`,
      // });

      processEditorCSS(editor);

      wpHooks.action.doCommand(PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND, {
        editor,
      });

      // Force a fresh height measurement now that new content is in the DOM.
      // The ResizeObserver may not fire because documentElement dimensions
      // don't necessarily change when inner content is replaced.
      autoResizeRef.current?.forceResize();
    } catch (error) {
      logger.error("Error loading template:", error);
      // Dismiss the loading overlay and surface the error to the user.
      // Without this, any exception in processAndGetTemplateInPreviewMode
      // (e.g. a data-fetching node referencing a non-existent post) would
      // leave the loading spinner visible forever.
      wpHooks.action.doCommand(PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND, {
        editor,
        error: `A data-fetching node failed to load its data: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  useEffect(() => {
    // if (!iframeState?.contentWindow) {
    //   return;
    // }
    return wpHooks.action.addCommand(
      CUSTOM_CODE_FETCHED_AND_UPDATED,
      ({ customCodes }) => {
        if (!iframeState?.contentWindow) {
          return;
        }

        const headerContent = generateCustomCode(customCodes.header ?? []);
        setInnerHTML(
          iframeState.contentWindow.document.head,
          headerContent,
          "header"
        );
      }
    );
  }, [iframeState, currentTemplate.id]);

  // Initial template load - should only execute once per iframe lifecycle.
  // The isIframeLoaded ref prevents re-loading when dependencies change.
  // Subsequent template changes are handled by the TEMPLATE_ID_UPDATED command listener below.
  useEffect(() => {
    if (isIframeLoaded.current === true) {
      logger.log("Iframe already loaded, skipping re-load of template");
      return;
    }

    const templateId = currentTemplate.id;
    if (!templateId || 0 >= templateId || isNaN(templateId)) {
      return;
    }
    loadTemplate(templateId);
  }, [currentTemplate.id, iframeState]);

  // Listen for runtime template changes triggered by user actions or external events.
  // This allows switching templates after the initial load without remounting the iframe.
  // Re-registers the command handler when iframeState changes to ensure the handler has the latest iframe reference.
  useEffect(() => {
    return wpHooks.action.addCommand(TEMPLATE_ID_UPDATED, ({ templateId }) => {
      if (iframeRef.current) {
        resetIframeHeight(iframeRef.current);
      }
      loadTemplate(templateId);
    });
  }, [iframeState]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_SELECTED_COMMAND,
      ({ previewInfo }) => {
        const templateId = currentTemplate.id;

        if (templateId) {
          loadTemplate(templateId, previewInfo.metaKey);
        }
      }
    );
  }, [iframeState, currentTemplate.id]);

  // Re-process React decorators after any node update to maintain decorator integrity.
  //
  // PROBLEM: When widgets are updated (e.g., width/height changes, data mutations),
  // processAndGetTemplate regenerates WidgetNode.innerHTML from the Lexical state.
  // This regenerated HTML includes placeholder divs for React decorators but NOT their rendered content.
  // React decorators must be separately rendered via createPortal into these placeholder divs.
  //
  // SOLUTION: Listen to NODE_UPDATED_COMMAND and re-process all decorators within widgets
  // to ensure decorator content is re-rendered after any structural or data changes.
  // Uses processAndGetDecoratorsInWidgets to traverse nested Lexical editors inside widgets.
  // The trackEventEnd wrapper throttles updates (100ms) to prevent excessive re-processing
  // during rapid successive node updates.
  useEffect(() => {
    return addLexicalCommands(
      editor,
      [NODE_UPDATED_COMMAND],
      (command, args) => {
        trackEventEnd(
          "react-decorator-process-after-node-change",
          () => {
            const { nodeKey } = args;

            // After a widget is selected and processed, we should make sure to load React Decorators again
            // to reflect any changes inside the widget.
            if (!iframeRef.current || !iframeRef.current.contentWindow) {
              logger.log(
                "No iframe or contentWindow found when processing decorators",
                iframeRef.current
              );

              return;
            }
            // Use processAndGetDecoratorsInWidgets (NOT processAndGetDecorators) because:
            // 1. Widgets contain nested Lexical editor instances with their own decorator nodes
            // 2. processAndGetDecorators only traverses the root editor, missing widget decorators
            // 3. Widget data mutations can affect decorator output, requiring full re-processing
            const decorators = processAndGetDecoratorsInWidgets(
              editor,
              //iframeState!.contentWindow!.document
              iframeRef.current!.contentWindow!.document
            );

            // const decoratorsInCollection = editor.read(() =>
            //   $getDecoratorsInCollection(
            //     node as WPLexicalNode,
            //     iframeRef.current!.contentWindow!.document
            //   )
            // );

            setReactDecorators([...decorators]);

            resizeIframeHeight(iframeRef.current!, breakpointRef, {
              enforceMinHeight: true,
            });
          },
          100
        );
        return false;
      }
    );
  }, [iframeState]);

  const updateIframOffset = useCallback(() => {
    if (!iframeState || !iframeState.style) return;

    const iframeElement = iframeRef.current || iframeState;
    updatePreviewIframeOffset(iframeElement);

    // // if heightDVH is 0, then set the initial height
    // if (0 >= breakpointRef.current.heightDVH) {
    //   // Adjust iframe styles based on breakpoints and zoom
    //   iframeElement.style.height = `${getScaledDVHlHeight()}dvh`;

    //   // Reset height DVH in breakpointRef
    //   setHeight(undefined, {
    //     triggerAction: false,
    //   });
    // }

    // // Set the iframe width based on the breakpoint and zoom
    // iframeElement.style.width = `${getPixelBreakpoint()}px`;

    // iframeElement.style.border = "none";
    // iframeElement.style.position = "absolute";

    wpHooks.action.doCommand(PREVIEW_LAYER_STYLE_UPDATED_COMMAND, {
      iframeWindow: iframeElement.contentWindow,
      iframe: iframeState,
    });
  }, [iframeState?.contentDocument?.body]);

  useEffect(() => {
    return wpHooks.action.addCommand(WP_BREAKPOINT_CHANGED_COMMAND, () => {
      updateIframOffset();
    });
  }, [iframeState?.contentDocument?.body]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
      () => {
        setTimeout(() => {
          updateIframOffset();
        });
      }
    );
  }, [iframeState?.contentDocument?.body]);

  // Set the initial fitted scale once the iframe content is available.
  // In pan mode, setFittedScale applies an extra 35% reduction so the whole
  // page is visible without being hidden behind the left navigation panel.
  useEffect(() => {
    setFittedScale(undefined, { isPanMode: wheelModeEnabledRef.current });
  }, [iframeState?.contentDocument?.body]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_SCROLL_COMMAND,
      ({ event, scroll }) => {
        const parentElement = iframeRef!.current!.parentElement!;

        parentElement.scrollBy(scroll.delta.x, scroll.delta.y);
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_ZOOMING_COMMAND,
      ({ event, direction }) => {
        setScaleByEvent(event);
      }
    );
  }, []);

  // In wheel mode the user pans the entire canvas instead of scrolling.
  // The iframe must be expanded to its full content height so all content is
  // reachable by panning — otherwise the iframe clips anything below its
  // initial fixed height. On disable, restore the normal DVH height via
  // updateIframOffset so the non-wheel layout is exactly unchanged.
  const wheelModeEnabledRef = useRef(true);

  // When iframe content becomes available, apply wheel mode height if already enabled.
  useEffect(() => {
    if (!wheelModeEnabledRef.current) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const contentHeight = iframe.contentDocument?.body?.scrollHeight;
    if (contentHeight) {
      iframe.style.height = `${contentHeight}px`;
    }
  }, [iframeState?.contentDocument?.body]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_CHANGED_COMMAND,
      ({ enabled }) => {
        wheelModeEnabledRef.current = enabled;
        const iframe = iframeRef.current;
        if (!iframe) return;
        if (enabled) {
          const contentHeight = iframe.contentDocument?.body?.scrollHeight;
          if (contentHeight) {
            iframe.style.height = `${contentHeight}px`;
          }
        } else {
          updateIframOffset();
        }
      }
    );
  }, [iframeState?.contentDocument?.body]);

  return (
    <iframe
      {...propsRest}
      ref={(ref) => {
        ref && setIframeState(ref);
        iframeRef.current = ref;

        if (!ref) return;

        const observer = new MutationObserver((mutations) => {
          if (
            ref.contentDocument?.readyState === "complete" &&
            isIframeLoaded.current === false
          ) {
            wpHooks.action.doCommand(PREVIEW_LAYER_LOADED_COMMAND, {
              iframeWindow: ref.contentWindow!,
              iframe: ref,
            });
            isIframeLoaded.current = true;

            //observer.disconnect();
            return;
          }

          wpHooks.action.doCommand(PREVIEW_LAYER_UPDATED_COMMAND, {
            iframeWindow: ref.contentWindow!,
            iframe: ref,
          });
        });

        // Observe both the entire document and specifically the head element
        observer.observe(ref.contentDocument!, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });

        autoResizeRef.current = setupIframeAutoResize(ref, breakpointRef, {
          enforceMinHeight: true,
          extraHeightPx: 100,
          skipResize: () => previewModeRef.current !== "edit",
        });
      }}
      style={{
        //overflowY: "hidden",
        backgroundColor: "white",
        zIndex: 0,
        // Keep this iframe visible in fullscreen mode as well.
        // Fullscreen now uses the same iframe instead of a second preview iframe.
        visibility:
          previewMode === "edit" // || previewMode === "fullscreen"
            ? "visible"
            : "hidden",
        //...(previewMode === "edit" ? {height: 0} : {})
      }}
    >
      {body && createPortal(children, body)}
      {reactDecorators}
    </iframe>
  );
};
