import { setStyles } from "./sync";

type CreateElementOptions = {
  className?: string;
  styles?: Partial<Record<keyof CSSStyleDeclaration, string>>;
  attrs?: Record<string, string>;
  on?: Partial<{
    [K in keyof HTMLElementEventMap]: (e: HTMLElementEventMap[K]) => void;
  }>;
  appendTo?: HTMLElement;
};

/**
 * Creates a DOM element with className, styles, attributes, event listeners,
 * and optionally appends it to a parent — all in one call.
 */
export const createMouseToolElement = (
  tag: keyof HTMLElementTagNameMap,
  options: CreateElementOptions = {}
): HTMLElement => {
  const { className, styles, attrs, on, appendTo } = options;

  const el = document.createElement(tag);

  if (className) el.className = className;
  if (styles) setStyles(el, styles);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (on) {
    Object.entries(on).forEach(([event, handler]) =>
      el.addEventListener(event, handler as EventListener)
    );
  }
  if (appendTo) appendTo.appendChild(el);

  return el;
};
