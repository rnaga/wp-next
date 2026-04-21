import type { CSSProperties } from "react";

/** Parse a CSS pixel string (e.g., "12px") or number-ish to a number. */
export const parsePx = (v?: string | null) => {
  const n = parseFloat(String(v ?? "").replace("px", ""));
  return Number.isFinite(n) ? n : 0;
};

export type GetClientXYParams = {
  event: MouseEvent;
  iframe: HTMLIFrameElement;
  scale: number;
};

/**
 * Convert window clientX/Y to coordinates relative to the scaled iframe content.
 */
export const getClientXYPosition = (props: GetClientXYParams) => {
  const { event, iframe, scale } = props;
  const iframeRect = iframe.getBoundingClientRect();
  return {
    clientX: (event.clientX - iframeRect.left) / scale,
    clientY: (event.clientY - iframeRect.top) / scale,
  };
};

/** Small helper to apply a set of style rules. */
export const setStyles = (
  el: HTMLElement,
  styles: Partial<Record<keyof CSSStyleDeclaration, string>>
) => {
  Object.entries(styles).forEach(([k, v]) => {
    if (v != null) {
      (el.style as unknown as Record<string, string>)[k] = v;
    }
  });
};

/**
 * Syncs essential size/position styles from the iframe into the canvas overlay,
 * and mirrors body box-model styles onto the inner container.
 */
export const syncStyles = (args: {
  iframe: HTMLIFrameElement;
  targetBox: HTMLElement;
  container: HTMLElement | null;
  scale: number;
  setBoxOffset?: (box: { left: number; top: number }) => void;
}) => {
  const { iframe, targetBox, container, scale, setBoxOffset } = args;
  const computedStyles = window.getComputedStyle(iframe);

  for (const propertyKey of ["width", "height", "top", "left"] as const) {
    const propertyValue = parseFloat(
      computedStyles.getPropertyValue(propertyKey)
    );
    targetBox.style.setProperty(propertyKey, `${propertyValue * scale}px`);
  }

  targetBox.style.setProperty("position", "absolute");

  const iframeBody = iframe.contentDocument?.body;
  if (iframeBody && container) {
    const bodyStyles = window.getComputedStyle(iframeBody);
    for (const property of [
      "borderWidth",
      "margin",
      "padding",
      "boxSizing",
    ] as const) {
      const value = bodyStyles.getPropertyValue(property);
      if (value) {
        container.style.setProperty(property, value);
      } else {
        container.style.removeProperty(property);
      }
    }
  }

  const boxRect = targetBox.getBoundingClientRect();
  setBoxOffset?.({ left: boxRect.left, top: boxRect.top });
};
