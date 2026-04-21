import type { DragDropPosition } from "../../drag-drop/types";
import { createMouseToolElement } from "./element";
import { setStyles } from "./sync";

/** Create or update the hover overlay (blue tint) on the canvas for the target element. */
export const ensureHoverOverlay = (
  container: HTMLElement,
  targetElement: HTMLElement,
  scale: number
) => {
  document.querySelector(".lexical-mouse-overlay")?.remove();

  const overlay = createMouseToolElement("div", {
    className: "lexical-mouse-overlay",
    styles: {
      position: "absolute",
      pointerEvents: "none",
      border: "1px solid blue",
      zIndex: "99",
      backgroundColor: "rgba(0, 0, 255, 0.1)",
    },
    appendTo: container,
  }) as HTMLDivElement;

  setOverlayPosition(overlay, targetElement, scale);
  overlay.style.setProperty("display", "block");
  return overlay;
};

/** Hide the hover overlay if present. */
export const removeHoverOverlay = () => {
  const overlay = document.querySelector(
    ".lexical-mouse-overlay"
  ) as HTMLElement;
  overlay?.style.setProperty("display", "none");
};

/** Create a red border overlay to indicate a valid drop target. */
export const createDragTargetOverlay = (
  rect: DOMRect,
  container: HTMLElement,
  scale: number,
  position?: DragDropPosition
) => {
  document.querySelector(".drag-overlay-border")?.remove();

  const overlay = createMouseToolElement("div", {
    className: "drag-overlay-border",
    styles: {
      position: "absolute",
      left: `${rect.left * scale + window.scrollX}px`,
      top: `${rect.top * scale + window.scrollY}px`,
      width: `${rect.width * scale}px`,
      height: `${rect.height * scale}px`,
      backgroundColor: "transparent",
      pointerEvents: "none",
      display: "block",
    },
    appendTo: container,
  }) as HTMLDivElement;

  if (position === "bottom") {
    overlay.style.borderBottom = "2px solid red";
  } else if (position === "top") {
    overlay.style.borderTop = "2px solid red";
  } else {
    overlay.style.border = "2px solid red";
  }

  return overlay;
};

/** Position an overlay element to match the size and location of a target element. */
export const setOverlayPosition = (
  overlay: HTMLDivElement,
  targetElement: HTMLElement,
  scale: number,
  options?: {
    styles?: Partial<Record<keyof CSSStyleDeclaration, string>>;
    parentElement?: HTMLElement | null;
    offsets?: Partial<{
      width: number;
      height: number;
      top: number;
      left: number;
    }>;
  }
) => {
  const rect = targetElement.getBoundingClientRect();
  const { offsets, styles } = options || {};

  const width = (rect.width + (offsets?.width || 0)) * scale;
  const height = (rect.height + (offsets?.height || 0)) * scale;
  const top = (rect.top + (offsets?.top || 0)) * scale;
  const left = (rect.left + (offsets?.left || 0)) * scale;

  setStyles(overlay, {
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    // Hide the overlay when the target element has no size — an invisible element
    // shouldn't be selectable or show resize handles.
    display: width === 0 && height === 0 ? "none" : "",
    transform: "none",
    transformOrigin: "0 0",
    pointerEvents: "none",
    ...styles,
  });
};
