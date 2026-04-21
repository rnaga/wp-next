import { BreakpointRef } from "../breakpoint";
import { usePreviewLayerContext } from "./PreviewLayerContext";
import { logger } from "../../lexical/logger";

const BODY_NODE_SELECTOR = "[data-lexical-body]";
const BODY_NODE_ATTRIBUTE_EXCLUSIONS = new Set(["data-lexical-body"]);

/**
 * Extracts the BodyNode from a generated HTML string, applies its inner content
 * to the target element, and copies its attributes (excluding data-lexical-body)
 * onto the document's <body> tag.
 *
 * @param htmlString - Raw HTML string from $generateHtmlFromNodes
 * @param targetElement - DOM element to receive the BodyNode's innerHTML
 * @param targetDocument - Document whose <body> tag receives the BodyNode's attributes
 */
export const applyBodyNodeToDocument = (
  htmlString: string,
  targetElement: HTMLElement,
  targetDocument: Document
): void => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(htmlString, "text/html");
  const bodyNode = parsed.querySelector(BODY_NODE_SELECTOR);

  if (!bodyNode) {
    logger.warn("applyBodyNodeToDocument: BodyNode element not found in generated HTML");
    targetElement.innerHTML = htmlString;
    return;
  }

  targetElement.innerHTML = bodyNode.innerHTML;

  for (const attr of Array.from(bodyNode.attributes)) {
    if (!BODY_NODE_ATTRIBUTE_EXCLUSIONS.has(attr.name)) {
      targetDocument.body.setAttribute(attr.name, attr.value);
    }
  }
};

export const usePreviewLayer = () => {
  return usePreviewLayerContext();
};

export const getIframeHeight = (
  iframe: HTMLIFrameElement,
  breakpointRef: BreakpointRef
) => {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return 0;

  const body = doc.body;
  const html = doc.documentElement;

  const scrollHeight = body?.scrollHeight || 0;

  if (scrollHeight > 0) {
    return scrollHeight;
  }

  // Fallback for edge cases where scrollHeight reports 0
  const offsetHeight = Math.max(
    body?.offsetHeight ?? 0,
    html?.offsetHeight ?? 0,
    body?.clientHeight ?? 0,
    html?.clientHeight ?? 0
  );
  return offsetHeight;
};

export const PREVIEW_MIN_HEIGHT_DVH = 90;

export type ResizeIframeHeightOptions = {
  enforceMinHeight?: boolean;
  /** Extra px added to the measured height. Use in PreviewLayer only to allow
   *  scrolling past the Toolbar that overlaps the bottom of the iframe. */
  extraHeightPx?: number;
  /** When this returns true the auto-resize ResizeObserver skips the cycle.
   *  Use to suppress resizing while the iframe is intentionally collapsed
   *  (e.g. in fullscreen mode where the FullScreenPreviewLayer is active). */
  skipResize?: () => boolean;
};

const getPreviewMinHeightPx = (iframe: HTMLIFrameElement) => {
  const viewportHeight =
    iframe.ownerDocument?.defaultView?.visualViewport?.height ??
    iframe.ownerDocument?.defaultView?.innerHeight ??
    window.innerHeight;

  return (viewportHeight * PREVIEW_MIN_HEIGHT_DVH) / 100;
};

export const resizeIframeHeight = (
  iframe: HTMLIFrameElement,
  breakpointRef: BreakpointRef,
  options: ResizeIframeHeightOptions = {}
) => {
  const h = getIframeHeight(iframe, breakpointRef);
  if (h <= 0) return;

  if (options.enforceMinHeight && h < getPreviewMinHeightPx(iframe)) {
    iframe.style.height = `${PREVIEW_MIN_HEIGHT_DVH}dvh`;
    return;
  }

  iframe.style.height = `${h + (options.extraHeightPx ?? 0)}px`;
};

export const resetIframeHeight = (iframe: HTMLIFrameElement) => {
  iframe.style.height = `${PREVIEW_MIN_HEIGHT_DVH}dvh`;
};

export type IframeAutoResize = {
  cleanup: () => void;
  /** Invalidate cached height and do a fresh collapse-measure-set cycle. */
  forceResize: () => void;
};

/**
 * Sets up automatic iframe height tracking on load event.
 * Listens for iframe load event, then monitors content changes using ResizeObserver.
 * Also handles late-loading fonts and images.
 *
 * @param iframe - The iframe element to track
 * @param breakpointRef - Reference to the current breakpoint state
 * @returns Object with cleanup function and resetMeasurement to invalidate cached height
 */
export const setupIframeAutoResize = (
  iframe: HTMLIFrameElement,
  breakpointRef: BreakpointRef,
  options: ResizeIframeHeightOptions = {}
): IframeAutoResize => {
  let observer: ResizeObserver | null = null;
  // Track the last measured content height (at height=0) to prevent infinite
  // resize loops caused by viewport-relative units like min-height: 100vh.
  // Declared in outer scope so resetMeasurement() can invalidate it on template changes.
  let lastMeasuredHeight = -1;

  const handleLoad = () => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Disconnect any previous observer before setting up a new one
    observer?.disconnect();
    observer = null;

    // Reset iframe height so content can collapse to its natural size before measuring.
    // Without this, a previously large height causes scrollHeight to report an inflated value.
    iframe.style.height = "0px";
    lastMeasuredHeight = -1;

    // Measure and apply the correct height
    resizeIframeHeight(iframe, breakpointRef, options);

    observer = new ResizeObserver(() => {
      if (options.skipResize?.()) return;
      const prevHeight = iframe.style.height;
      // Collapse iframe so vh-based content shrinks to its natural size
      iframe.style.height = "0px";
      const h = getIframeHeight(iframe, breakpointRef);

      if (h === lastMeasuredHeight) {
        // Content hasn't actually changed; restore previous height
        iframe.style.height = prevHeight;
        return;
      }

      lastMeasuredHeight = h;
      resizeIframeHeight(iframe, breakpointRef, options);
    });
    observer.observe(doc.documentElement);

    // Handle late-loading fonts/images
    doc.fonts?.ready?.then(() =>
      resizeIframeHeight(iframe, breakpointRef, options)
    );
  };

  iframe.addEventListener("load", handleLoad);

  return {
    cleanup: () => {
      iframe.removeEventListener("load", handleLoad);
      observer?.disconnect();
    },
    forceResize: () => {
      lastMeasuredHeight = -1;
      iframe.style.height = "0px";
      resizeIframeHeight(iframe, breakpointRef, options);
    },
  };
};
