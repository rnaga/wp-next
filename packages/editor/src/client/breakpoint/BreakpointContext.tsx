import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useWP } from "@rnaga/wp-next-core/client/wp";

import {
  WP_BREAKPOINT_CHANGED_COMMAND,
  WP_BREAKPOINT_DEVICE_CHANGED_COMMAND,
  WP_BREAKPOINT_HEIGHT_CHANGED_COMMAND,
  WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
  WP_BREAKPOINT_WIDTH_CHANGED_COMMAND,
} from "./commands";

import type * as types from "../../types";
import type { BreakpointRef } from "./types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PREVIEW_LAYER_LOADED_COMMAND } from "../preview-layer/commands";
import { CSSDevice } from "../../lexical/styles-core/css-device";
import { registerLexicalCommand } from "../event-utils/commands";
import { getIframeHeight } from "../preview-layer";

const Context = createContext<{
  breakpointRef: BreakpointRef;
  device: types.BreakpointDevice;
  getParentElement: () => HTMLElement | null;
  setDevice: (breakPoint: types.BreakpointDevice) => void;
  setScale: (zoom: number) => void;
  setScaleByEvent: (event: WheelEvent) => void;
  setWidth: (wrapperWidth: number, widthRatio: number) => void;
  getPixelBreakpoint: () => number;
  setFittedScale: (breakPoint?: number, options?: { isPanMode?: boolean }) => void;
  getBreakpointByDevice: (device: types.BreakpointDevice) => number;
  getScaledDVHlHeight: () => number;
  setHeight: (
    increaseRatio: number | undefined,
    options?: {
      triggerAction?: boolean;
    }
  ) => void;
}>({} as any);

export const useBreakpointContext = () => useContext(Context);

export const BreakpointContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const { wpHooks } = useWP();
  const [editor] = useLexicalComposerContext();

  const breakpointRef = useRef({
    device: "desktop" as types.BreakpointDevice,
    scale: 1,
    wrapperWidth: 0,
    widthRatio: 1,
    heightDVH: 0,
  });
  const [device, setDeviceReactState] =
    useState<types.BreakpointDevice>("desktop");

  // BreakpointContext is rendered above PreviewLayerContext in the component tree,
  // so it cannot consume the iframe ref from PreviewLayerContext. Instead, we maintain
  // this ref internally and populate it by listening to the PREVIEW_LAYER_LOADED_COMMAND.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    return wpHooks.action.addCommand(
      PREVIEW_LAYER_LOADED_COMMAND,
      ({ iframe }) => {
        iframeRef.current = iframe;
      }
    );
  }, []);

  const getParentElement = () => {
    if (!iframeRef.current) return null;
    return iframeRef.current.parentElement;
  };

  const setWidthAndRatio = () => {
    const wrapperWidth = getWrapperWidth();
    const widthRatio = getWidthRatio();

    setWidthState({ wrapperWidth, widthRatio });
  };

  const setScale = (scale: number) => {
    breakpointRef.current.scale = scale;

    setWidthAndRatio();
    setHeight(undefined, { triggerAction: false });

    wpHooks.action.doCommand(
      WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
      breakpointRef
    );

    wpHooks.action.doCommand(WP_BREAKPOINT_CHANGED_COMMAND, breakpointRef);
  };

  const setDevice = (device: types.BreakpointDevice) => {
    CSSDevice.__current = device;
    setDeviceState(device);

    setWidthAndRatio();

    wpHooks.action.doCommand(
      WP_BREAKPOINT_DEVICE_CHANGED_COMMAND,
      breakpointRef
    );

    wpHooks.action.doCommand(WP_BREAKPOINT_CHANGED_COMMAND, breakpointRef);
  };

  const setDeviceState = (device: types.BreakpointDevice) => {
    breakpointRef.current.device = device;
    setDeviceReactState(device);
  };

  const setWidthState = (width: {
    wrapperWidth: number;
    widthRatio: number;
  }) => {
    breakpointRef.current.wrapperWidth = width.wrapperWidth;
    breakpointRef.current.widthRatio = width.widthRatio;
  };

  const setWidth = (wrapperWidth: number, widthRatio: number) => {
    setWidthState({ wrapperWidth, widthRatio });

    wpHooks.action.doCommand(
      WP_BREAKPOINT_WIDTH_CHANGED_COMMAND,
      breakpointRef
    );

    wpHooks.action.doCommand(WP_BREAKPOINT_CHANGED_COMMAND, breakpointRef);
  };

  const setHeight = (
    increaseRatio?: number,
    options?: {
      triggerAction?: boolean;
    }
  ) => {
    const { triggerAction = true } = options || {};
    const scale =
      1 < breakpointRef.current.scale ? 1 : breakpointRef.current.scale;

    let heightDVH = getScaledDVHlHeight();

    if (increaseRatio) {
      // Get computed height (in px) based on the current height and the increase ratio
      // const computedHeightPx = parseFloat(
      //   getComputedStyle(iframeRef.current!.contentWindow!.document.body).height
      // );
      const innerHeight = window.innerHeight;
      const computedHeightPx = getIframeHeight(
        iframeRef.current!,
        breakpointRef
      );

      // 1. multiply the current height by the increase ratio
      // 2. divide by the inner height
      // 3. multiply by the scale
      // 4. then multiply by the current heightDVH
      //
      // 1 - 3 generates the ratio of the new height to the current height
      heightDVH =
        heightDVH *
        (((computedHeightPx * increaseRatio) / innerHeight) * scale);
    }

    breakpointRef.current.heightDVH = heightDVH;

    if (!triggerAction) {
      return;
    }

    wpHooks.action.doCommand(
      WP_BREAKPOINT_HEIGHT_CHANGED_COMMAND,
      breakpointRef
    );

    wpHooks.action.doCommand(WP_BREAKPOINT_CHANGED_COMMAND, breakpointRef);
  };

  const setScaleByEvent = (event: WheelEvent) => {
    const scale = breakpointRef.current.scale;

    const zoomIntensity = 0.05;

    let newScale =
      event.deltaY < 0 ? scale + zoomIntensity : scale - zoomIntensity;

    // Limit the scale to reasonable values
    newScale = Math.min(Math.max(newScale, 0.3), 2);

    setScale(newScale);
  };

  /**
   * Calculates the available width for the preview layer wrapper.
   *
   * This function subtracts 350px from the window's inner width to account for:
   * - The left sidebar/panel width
   * - Additional UI chrome (padding, borders, etc.)
   *
   * The wrapper width is used to:
   * 1. Calculate the initial preview layer dimensions
   * 2. Determine the width ratio (wrapperWidth / deviceBreakpoint) for responsive scaling
   * 3. Calculate the fitted scale when the preview needs to fit within the available space
   * 4. Recalculate dimensions on window resize
   *
   * @returns The available width in pixels for the preview layer wrapper
   *
   * Note: To increase the initial preview width, decrease the 350px value.
   */
  const getWrapperWidth = () => window.innerWidth - 350;

  const getBreakpointByDevice = (device: types.BreakpointDevice) => {
    switch (device) {
      case "mobile":
        return 390;
      case "tablet":
        return 768;
      case "desktop":
        // Important: 1201px instead of 1200px ensures proper alignment with CSS media query breakpoints.
        // CSS media queries use > 1200px for desktop, so we need 1201px here to avoid off-by-one issues.
        // See: src/lexical/styles-core/media-query.ts
        return 1201;
    }
  };

  const getPixelBreakpoint = () =>
    getBreakpointByDevice(breakpointRef.current.device);

  const getWidthRatio = () => {
    return getWrapperWidth() / getPixelBreakpoint();
  };

  /**
   * Sets the preview scale so the canvas fits within the available wrapper width.
   *
   * In normal mode the scale is clamped to [fitted, 1] — the page fills the
   * space but never zooms in beyond 100%.
   *
   * In pan mode (Figma/Framer style) an additional 35% reduction is applied so
   * the full page is visible without being obscured by the left navigation panel.
   * The pan offset keeps the content reachable, so the extra breathing room is
   * always recoverable by panning.
   *
   * @param breakPoint - Target pixel width to fit within; defaults to the
   *   current device breakpoint (e.g. 1201 for desktop).
   * @param options.isPanMode - When true, reduce the fitted scale by 20% so
   *   the whole canvas is visible alongside the left panel.
   */
  const setFittedScale = (
    breakPoint?: number,
    options?: { isPanMode?: boolean }
  ) => {
    const { isPanMode = false } = options ?? {};
    breakPoint = breakPoint ?? getPixelBreakpoint();

    // Calculate scale based on the breakpoint
    let scale = getWrapperWidth() / breakPoint;

    if (scale >= 1) {
      // In pan mode, apply the 20% reduction even when the canvas would
      // otherwise fit at 100%, so there is still visible breathing room.
      setScale(isPanMode ? 0.65 : 1);
      return;
    }

    // In pan mode, pull back 35% from the fitted scale so the page is not
    // flush against the left panel edge.
    if (isPanMode) {
      scale *= 0.65;
    }

    setScale(scale);
  };

  const handleResize = () => {
    const wrapperWidth = getWrapperWidth();
    const widthRatio = getWidthRatio();

    setWidth(wrapperWidth, widthRatio);
    setHeight(undefined, { triggerAction: false });
  };

  const getScaledDVHlHeight = () => {
    const scale = breakpointRef.current.scale;
    return scale >= 1 ? 2 * (100 * scale) : 2 * (100 / scale);
  };

  useEffect(() => {
    window.removeEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Context
      value={{
        breakpointRef,
        device,
        getParentElement,
        setDevice,
        setScale,
        setScaleByEvent,
        setWidth,
        getPixelBreakpoint,
        setFittedScale,
        getBreakpointByDevice,
        getScaledDVHlHeight,
        setHeight,
      }}
    >
      {children}
    </Context>
  );
};
