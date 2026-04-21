import { useWP } from "@rnaga/wp-next-core/client/wp";
import React, {
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { WP_BREAKPOINT_CHANGED_COMMAND } from "../breakpoint/commands";
import { useBreakpoint } from "../breakpoint";
import { addWPHooksActionCommands } from "../event-utils";
import {
  PREVIEW_LAYER_LOADED_COMMAND,
  PREVIEW_LAYER_MODE_UPDATED_COMMAND,
} from "./commands";
import { MAIN_AREA_LOADED_COMMAND } from "../layout/commands";
import { resizeIframeHeight } from "./preview-layer";
import { useCustomCode } from "../custom-code";
import { TEMPLATE_ID_UPDATED } from "../template/commands";
import { logger } from "../../lexical/logger";

type MessageHandler = (data: any) => void;

const HEADER_HEIGHT_PX = 50;

const Context = createContext<{
  iframeRef: { current: HTMLIFrameElement | null };
  fullscreenIframeRef: { current: HTMLIFrameElement | null };
  mainAreaRef: { current: HTMLDivElement | null };
  previewMode: "edit" | "fullscreen";
  updatePreviewMode: (mode: "edit" | "fullscreen") => void;
  sendMessageToIframe: (message: any) => void;
  onMessageFromIframe: (handler: MessageHandler) => () => void;
  updatePreviewIframeOffset: (
    iframe?: HTMLIFrameElement | null,
    options?: { fullscreen?: boolean }
  ) => void;
}>({} as any);

export const usePreviewLayerContext = () => {
  const context = useContext(Context);
  return context;
};

export const PreviewLayerContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement | null>(null);
  const mainAreaRef = useRef<HTMLDivElement | null>(null);
  const {
    getPixelBreakpoint,
    breakpointRef,
    getScaledDVHlHeight,
    setHeight,
    setScale,
  } = useBreakpoint();
  const [previewMode, setPreviewMode] = useState<"edit" | "fullscreen">("edit");
  const previewModeRef = useRef(previewMode);
  // Stores the scale that was active when the user last left "edit" mode,
  // so it can be restored when returning from fullscreen.
  const editScaleRef = useRef(breakpointRef.current.scale);

  const { current: currentCustomCode } = useCustomCode();

  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());

  const { wpHooks } = useWP();

  const updatePreviewMode = (mode: "edit" | "fullscreen") => {
    if (mode === "fullscreen") {
      editScaleRef.current = breakpointRef.current.scale;
      setScale(0.9);
    } else {
      setScale(editScaleRef.current);
    }
    previewModeRef.current = mode;
    setPreviewMode(mode);
    wpHooks.action.doCommand(PREVIEW_LAYER_MODE_UPDATED_COMMAND, { mode });
  };

  // Function to send message to iframe
  const sendMessageToIframe = (message: any) => {
    // const targetIframe = previewMode === "fullscreen"
    //   ? fullscreenIframeRef.current
    //   : iframeRef.current;
    const targetIframe = fullscreenIframeRef.current;

    if (!targetIframe?.contentWindow) {
      logger.warn("Cannot send message: iframe not available");
      return;
    }

    // Same-host validation: only send to same origin
    const targetOrigin = window.location.origin;

    logger.log("Sending message to iframe:", message);
    targetIframe.contentWindow.postMessage(message, targetOrigin);
  };

  // Function to register message handler
  const onMessageFromIframe = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  const updatePreviewIframeOffset = (
    iframe?: HTMLIFrameElement | null,
    options?: { fullscreen?: boolean }
  ) => {
    if (!iframe) {
      return;
    }

    if (options?.fullscreen) {
      // In fullscreen mode, fix the iframe to the visible area below the header so
      // the parent window never scrolls — only the iframe content scrolls internally.
      // No scale compensation needed: the container transform is "none" in fullscreen.
      iframe.style.height = `calc(100dvh - ${HEADER_HEIGHT_PX}px)`;
    } else {
      // if heightDVH is 0, then set the initial height
      if (0 >= breakpointRef.current.heightDVH) {
        // Adjust iframe styles based on breakpoints and zoom
        iframe.style.height = `${getScaledDVHlHeight()}dvh`;

        // Reset height DVH in breakpointRef
        setHeight(undefined, {
          triggerAction: false,
        });
      }
    }

    // Set the iframe width based on the breakpoint and zoom
    iframe.style.width = `${getPixelBreakpoint()}px`;

    iframe.style.border = "none";
    iframe.style.position = "absolute";
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Same-host validation: only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      // Verify message is from our iframe
      const isFromIframe =
        event.source === iframeRef.current?.contentWindow ||
        event.source === fullscreenIframeRef.current?.contentWindow;

      if (!isFromIframe) {
        return;
      }

      // Call all registered handlers
      messageHandlersRef.current.forEach((handler) => {
        handler(event.data);
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const updateMainAreaStyles = () => {
    logger.log("Updating main area styles for preview layer",
      previewModeRef.current
    );
    if (
      !mainAreaRef.current ||
      (previewModeRef.current === "edit" && !iframeRef.current) ||
      (previewModeRef.current === "fullscreen" && !fullscreenIframeRef.current)
    ) {
      logger.log("Main area or iframe not ready yet");
      return;
    }
    const { wrapperWidth, scale } = breakpointRef.current;

    const widthPercentage = 100 * (wrapperWidth / (wrapperWidth * scale));
    const heightValue = 90 / (scale >= 1 ? 1 : scale);

    // IMPORTANT: Compute scaled iframe width to determine justifyContent below.
    // If scaled iframe width > wrapper width → use "flex-start" (allow left-aligned scrolling)
    // If scaled iframe width ≤ wrapper width → use "center" (center the content)
    const computedIframeWidth = iframeRef.current
      ? parseFloat(getComputedStyle(iframeRef.current!).width) * scale
      : undefined;

    // Set width and scale of the main area
    mainAreaRef.current.style.width = `${widthPercentage}%`;
    mainAreaRef.current.style.transform = `scale(${scale})`;
    // In fullscreen mode, cap the container to the visible area below the header so
    // the parent window does not grow a vertical scrollbar.
    if (previewModeRef.current === "fullscreen") {
      mainAreaRef.current.style.height = `calc(100dvh - ${HEADER_HEIGHT_PX}px)`;
    } else {
      mainAreaRef.current.style.height = `${heightValue}dvh`;
    }

    if (previewModeRef.current === "edit") {
      mainAreaRef.current.style.justifyContent =
        computedIframeWidth && computedIframeWidth > wrapperWidth
          ? "flex-start"
          : "center";
    }

    if (previewModeRef.current === "fullscreen") {
      mainAreaRef.current.style.justifyContent =
        computedIframeWidth && computedIframeWidth > window.innerWidth
          ? "flex-start"
          : "center";
    }

    // In fullscreen mode, collapse the regular preview iframe so it does not
    // contribute to window scroll while the fullscreen iframe is active.
    // In edit mode, resize it to fit its content as usual.
    if (previewModeRef.current === "fullscreen") {
      if (iframeRef.current) {
        iframeRef.current.style.height = "0px";
      }
    } else {
      // Collapse to 0px before measuring so scrollHeight reflects the natural
      // content height (not an inflated value from viewport-relative units or
      // a previously-set large height). This is especially important when
      // returning from fullscreen, where the iframe was at 0px and the
      // ResizeObserver won't re-fire because the content hasn't changed.
      // Collapsing first makes it safe to include extraHeightPx here.
      if (iframeRef.current) {
        iframeRef.current.style.height = "0px";
      }
      resizeIframeHeight(iframeRef.current!, breakpointRef, {
        enforceMinHeight: true,
        extraHeightPx: 100,
      });
    }
  };

  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [WP_BREAKPOINT_CHANGED_COMMAND],
      () => {
        updateMainAreaStyles();
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_LAYER_LOADED_COMMAND,
      ({ iframe }) => {
        iframeRef.current = iframe;
        updateMainAreaStyles();
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(TEMPLATE_ID_UPDATED, () => {
      // Reset heightDVH and apply the initial DVH-based height to both iframes,
      // matching the behaviour on first load. Without this reset, the ResizeObserver
      // reads the previous template's stale scrollHeight and sets an incorrect height.
      breakpointRef.current.heightDVH = 0;
      const initialHeight = `${getScaledDVHlHeight()}dvh`;
      if (iframeRef.current) {
        iframeRef.current.style.height = initialHeight;
      }
      if (fullscreenIframeRef.current) {
        fullscreenIframeRef.current.style.height = initialHeight;
      }
      setHeight(undefined, { triggerAction: false });
    });
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_LAYER_MODE_UPDATED_COMMAND,
      ({ mode }) => {
        updateMainAreaStyles();
      }
    );
  }, [previewMode]);

  // NOTE: This handler never gets called due to React timing issues.
  // MAIN_AREA_LOADED_COMMAND is dispatched from MainArea.tsx ref callback
  // which fires during render, BEFORE this useEffect runs and registers the handler.
  // Execution order: MainArea renders → ref callback fires → command dispatched →
  // THEN effects run (too late, handler missed the event).
  //
  // useLayoutEffect doesn't work either - it still runs AFTER all DOM mutations from
  // the render, which is after the ref callback has already fired.
  //
  // CURRENT WORKAROUND: mainAreaRef.current is set directly in MainArea.tsx ref callback.
  //
  // TO FIX PROPERLY: Would need to register handler synchronously during render phase
  // (not in an effect), but that's complex with React hooks and violates best practices.
  // Consider refactoring to avoid command pattern for ref synchronization.
  useEffect(() => {
    return wpHooks.action.addCommand(
      MAIN_AREA_LOADED_COMMAND,
      ({ mainArea }) => {
        mainAreaRef.current = mainArea;
        updateMainAreaStyles();
      }
    );
  }, []);

  return (
    <Context
      value={{
        iframeRef,
        fullscreenIframeRef,
        mainAreaRef,
        previewMode,
        updatePreviewMode,
        sendMessageToIframe,
        onMessageFromIframe,
        updatePreviewIframeOffset,
      }}
    >
      {children}
    </Context>
  );
};
