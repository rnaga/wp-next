import { LexicalEditor } from "lexical";

import { BREAKPOINTS, CSS_DEFAULT_DEVICE } from "../styles-core/constants";
import { getMediaQueryMaxAndMin } from "../styles-core/media-query";

import type * as types from "../../types";
import type { WPLexicalNode } from "../nodes/wp/types";

// TODO: Fix circular dependencies here
// Lazy load to avoid circular dependencies
let walkNodeWithWidgets:
  | typeof import("../lexical").walkNodeWithWidgets
  | null = null;
let $isWPLexicalNode: typeof import("../nodes/wp").$isWPLexicalNode | null =
  null;
let $isAnimationNode:
  | typeof import("../nodes/animation/AnimationNode").$isAnimationNode
  | null = null;

const getLazyImports = () => {
  if (!walkNodeWithWidgets) {
    walkNodeWithWidgets = require("../lexical").walkNodeWithWidgets;
  }
  if (!$isWPLexicalNode) {
    $isWPLexicalNode = require("../nodes/wp").$isWPLexicalNode;
  }
  if (!$isAnimationNode) {
    $isAnimationNode =
      require("../nodes/animation/AnimationNode").$isAnimationNode;
  }
  return { walkNodeWithWidgets, $isWPLexicalNode, $isAnimationNode };
};

export interface CSSAnimation {
  $id: string;
  $type: string;
  $keyframeName: string;
  $triggerEvent: string;
  $targetElement?: string;
  $pseudoElement?: string;
  $customProperties?: Record<string, string>;
  $duration: string;
  $timingFunction: string;
  $delay: string;
  $iterationCount: string;
  $direction: string;
  $fillMode: string;
  $playState: string;
}

export interface ConvertedAnimation {
  css: string[];
  js: string[];
}

const CSS_TRIGGER_EVENTS = new Set([
  "hover",
  "focus",
  "active",
  "focus-within",
  "focus-visible",
]);

const PAGELOAD_TRIGGER_EVENTS = new Set(["load"]);

const buildAnimationValue = (animation: CSSAnimation): string => {
  const {
    $keyframeName,
    $duration,
    $timingFunction,
    $delay,
    $iterationCount,
    $direction,
    $fillMode,
    $playState,
  } = animation;

  return `${$keyframeName} ${$duration} ${$timingFunction} ${$delay} ${$iterationCount} ${$direction} ${$fillMode} ${$playState}`;
};

/**
 * Builds the CSS rule body — custom properties first (e.g., content, position),
 * then the optional animation shorthand.  Ordering custom properties before animation
 * ensures they are always present even when the animation is the only rule that changes.
 *
 * animationValue is omitted when the rule has no keyframe (pseudo-element-only rules
 * that apply custom properties without playing an animation).
 */
const buildCSSBlock = (
  animationValue: string | undefined,
  customProperties?: Record<string, string>
): string => {
  const lines: string[] = [];

  if (customProperties) {
    for (const [prop, val] of Object.entries(customProperties)) {
      lines.push(`  ${prop}: ${val};`);
    }
  }

  if (animationValue) {
    lines.push(`  animation: ${animationValue};`);
  }

  return lines.join("\n");
};

const generateAnimationClassName = (id: string): string => {
  return `is-animating-${id}`;
};

/**
 * JavaScript templates for animation event handlers.
 * These templates generate the runtime code that manages animation triggers.
 */

interface AnimationAction {
  animationClassName: string;
  targetElement?: string;
}

/**
 * Generates code to apply animation to an element (or target element).
 * This removes the animation class, forces reflow, then re-adds it to restart the animation.
 */
const generateAnimationTrigger = (action: AnimationAction): string => {
  const { animationClassName, targetElement } = action;

  if (targetElement) {
    return `    document.querySelectorAll(".${targetElement}").forEach((target) => {
      target.classList.remove("${animationClassName}");
      // force restart
      void target.offsetWidth;
      target.classList.add("${animationClassName}");
    });`;
  }

  return `    element.classList.remove("${animationClassName}");
    // force restart
    void element.offsetWidth;
    element.classList.add("${animationClassName}");`;
};

/**
 * Generates scroll event handler with hover detection.
 * Animations only trigger when scrolling while hovering over the element.
 */
const generateScrollEventHandler = (actions: AnimationAction[]): string => {
  const animationTriggers = actions
    .map((action) => generateAnimationTrigger(action))
    .join("\n\n");

  return `  let isHovering = false;

  element.addEventListener("mouseenter", () => {
    isHovering = true;
  });

  element.addEventListener("mouseleave", () => {
    isHovering = false;
  });

  window.addEventListener("scroll", () => {
    if (!isHovering) return;

${animationTriggers}
  });`;
};

/**
 * Generates a standard event handler (click, dblclick, mouseenter, etc.).
 * For click events, both click and touchend are added for mobile support.
 */
const generateEventHandler = (
  eventType: string,
  actions: AnimationAction[]
): string => {
  const animationTriggers = actions
    .map((action) => generateAnimationTrigger(action))
    .join("\n\n");

  return `  element.addEventListener("${eventType}", () => {
${animationTriggers}
  });`;
};

/**
 * Wraps event handlers in an IIFE with element selector.
 */
const generateEventHandlerWrapper = (
  className: string,
  eventHandlers: string[]
): string => {
  return `(() => {
  document.querySelectorAll(".${className}").forEach((element) => {
${eventHandlers.join("\n\n")}
  });
})();`;
};

const generateJavaScript = (
  className: string,
  animations: CSSAnimation[]
): string => {
  const eventHandlers = new Map<string, CSSAnimation[]>();

  // Group animations by trigger event
  for (const animation of animations) {
    const event = animation.$triggerEvent.toLowerCase();
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, []);
    }
    eventHandlers.get(event)!.push(animation);
  }

  const handlers: string[] = [];

  for (const [event, eventAnimations] of eventHandlers) {
    // Convert animations to action objects
    const actions: AnimationAction[] = eventAnimations.map((animation) => ({
      animationClassName: generateAnimationClassName(animation.$id),
      targetElement: animation.$targetElement,
    }));

    // Special handling for scroll event - requires hover + scroll combination
    if (event === "scroll") {
      handlers.push(generateScrollEventHandler(actions));
      continue;
    }

    // Regular event handlers
    // For click events, also add touchend for mobile support
    const events = event === "click" ? ["click", "touchend"] : [event];

    for (const eventType of events) {
      handlers.push(generateEventHandler(eventType, actions));
    }
  }

  return generateEventHandlerWrapper(className, handlers);
};

/**
 * Converts animation configurations into CSS rules and JavaScript code.
 *
 * This function processes animations and generates the necessary CSS and JS based on their trigger events:
 * - CSS-based triggers (hover, focus, active, etc.) are handled with pure CSS pseudo-selectors
 * - Page load triggers (load) apply animation directly to the element without JavaScript
 * - Scroll triggers (scroll) trigger when window scrolls while mouse is hovering over the element
 * - Click triggers include both click and touchend events for mobile support
 * - JS-based triggers (dblclick, mouseenter, mouseleave, blur) generate CSS classes + JavaScript event listeners
 *
 * @param className - The CSS class name of the element that owns these animations
 * @param animations - Array of animation configurations to process
 * @returns Object containing arrays of CSS rules and JS code strings
 *
 * @example
 * // For a hover trigger:
 * // CSS: .my-element:hover { animation: fadeIn 1s ease; }
 *
 * // For a page load trigger:
 * // CSS: .my-element { animation: fadeIn 1s ease; }
 *
 * // For a scroll trigger:
 * // CSS: .my-element.is-animating-123 { animation: fadeIn 1s ease; }
 * // JS: window.addEventListener("scroll", () => { if (isHovering) element.classList.add("is-animating-123"); });
 *
 * // For a click trigger (includes touchend for mobile):
 * // CSS: .my-element.is-animating-123 { animation: fadeIn 1s ease; }
 * // JS: element.addEventListener("click", () => { element.classList.add("is-animating-123"); });
 * // JS: element.addEventListener("touchend", () => { element.classList.add("is-animating-123"); });
 */
export const animationsValueToStringCSSAndJS = (
  className: string,
  animations: CSSAnimation[]
): ConvertedAnimation => {
  const css: string[] = [];
  const js: string[] = [];

  // Collect animations that require JavaScript event listeners
  const jsAnimations: CSSAnimation[] = [];

  for (const animation of animations) {
    const hasKeyframe = Boolean(animation.$keyframeName);
    // Only build the animation shorthand when a keyframe is selected; omit it for
    // pseudo-element-only rules that use custom properties without playing an animation.
    const animationValue = hasKeyframe ? buildAnimationValue(animation) : undefined;
    const triggerEvent = animation.$triggerEvent.toLowerCase();
    const targetElement = animation.$targetElement;
    const pseudoElement = animation.$pseudoElement || "";
    const customProperties = animation.$customProperties;
    const cssBlock = buildCSSBlock(animationValue, customProperties);

    // Skip rules that would produce an empty CSS block (no keyframe and no custom properties)
    if (!cssBlock.trim()) {
      continue;
    }

    if (CSS_TRIGGER_EVENTS.has(triggerEvent)) {
      // CSS-based trigger: Use pseudo-selectors (e.g., :hover, :focus)
      // If targetElement is specified, use :has() to trigger animation on a different element
      const cssRule = targetElement
        ? // Target element with :has() selector; pseudo-element appended to target
          `body:has(.${className}:${triggerEvent}) .${targetElement}${pseudoElement} {\n${cssBlock}\n}`
        : // Direct element trigger; pseudo-element appended to source
          `.${className}:${triggerEvent}${pseudoElement} {\n${cssBlock}\n}`;

      css.push(cssRule);
      continue;
    }

    if (PAGELOAD_TRIGGER_EVENTS.has(triggerEvent)) {
      // Page load trigger: Apply animation directly without requiring JavaScript
      // The animation class will be added to the element in the HTML output
      const targetClassName = targetElement || className;
      const cssRule = `.${targetClassName}${pseudoElement} {\n${cssBlock}\n}`;

      css.push(cssRule);
      continue;
    }

    // JS-based trigger: Generate a CSS class and collect for JavaScript generation
    // The animation is triggered by adding/removing the class via JavaScript
    const animationClassName = generateAnimationClassName(animation.$id);
    const targetClassName = targetElement || className;
    const cssRule = `.${targetClassName}.${animationClassName}${pseudoElement} {\n${cssBlock}\n}`;

    css.push(cssRule);
    jsAnimations.push(animation);
  }

  // Generate JavaScript event listeners for non-CSS triggers
  if (jsAnimations.length > 0) {
    const jsCode = generateJavaScript(className, jsAnimations);
    js.push(jsCode);
  }

  return { css, js };
};

/**
 * Generates device-specific CSS and JavaScript for animations defined on a WPLexicalNode.
 *
 * This function processes animations across all responsive breakpoints (mobile, tablet, desktop, largeDesktop)
 * and wraps them in appropriate media queries so animations only apply on their target devices.
 *
 * How it works:
 * 1. Iterates through each breakpoint device (e.g., mobile: 479px, tablet: 768px, desktop: 1200px)
 * 2. For each device, extracts animation configurations from the node's styles
 * 3. Converts animations to CSS rules and JS code using animationsValueToStringCSSAndJS()
 * 4. Wraps CSS rules in media queries so they only apply at the correct screen size
 * 5. Wraps JS code in window.matchMedia() checks so event listeners only run on matching devices
 *
 * @param node - The WPLexicalNode containing device-specific animation styles
 * @returns Object with css and js arrays, each wrapped with device-specific media queries
 *
 * @example
 * // Input: Node with mobile animation (fadeIn on click) and desktop animation (slideUp on hover)
 * // Output CSS:
 * // @media screen and (max-width: 479px) {
 * //   .element.is-animating-123 { animation: fadeIn 1s ease; }
 * // }
 * // @media screen and (min-width: 1201px) {
 * //   .element:hover { animation: slideUp 1s ease; }
 * // }
 *
 * // Output JS:
 * // if (window.matchMedia('(max-width: 479px)').matches) {
 * //   element.addEventListener("click", () => { ... });
 * // }
 */
export const nodeToAnimationStringCSSAndJS = (node: WPLexicalNode) => {
  // Get raw styles from node
  const styles = node.__css.__styles;
  const className = node.__css.getClassName();
  let allCSS: string[] = [];
  let allJS: string[] = [];

  // Loop through devices (mobile, tablet, desktop, largeDesktop)
  for (const [device, breakpoint] of Object.entries(BREAKPOINTS)) {
    const animationCSS = styles[device]?.__animation;
    if (animationCSS && animationCSS.length > 0) {
      // Convert animations to CSS rules and JS code
      const { css, js } = animationsValueToStringCSSAndJS(
        className,
        animationCSS
      );

      // Mirror style-core cascade behavior: desktop is the default device and its
      // rules apply to all screen sizes without a media query. Non-desktop devices
      // wrap rules in a media query so they only override on their target breakpoint.
      if (css.length > 0) {
        if (device === CSS_DEFAULT_DEVICE) {
          allCSS.push(...css);
        } else {
          const mediaQuery = getMediaQueryMaxAndMin(
            device as types.BreakpointDevice
          );
          const wrappedCSS = `${mediaQuery} {\n${css
            .map((rule) => `  ${rule.replace(/\n/g, "\n  ")}`)
            .join("\n")}\n}`;
          allCSS.push(wrappedCSS);
        }
      }

      // Same cascade logic for JS: desktop event listeners run unconditionally;
      // non-desktop listeners are guarded by window.matchMedia so they only attach
      // on the correct breakpoint.
      if (js.length > 0) {
        if (device === CSS_DEFAULT_DEVICE) {
          allJS.push(...js);
        } else {
          const mediaQuery = getMediaQueryMaxAndMin(
            device as types.BreakpointDevice
          );
          // Extract media condition from query (e.g., "(max-width: 768px)")
          const mediaCondition = mediaQuery.replace("@media screen and ", "");
          const deviceFilteredJS = `if (window.matchMedia('${mediaCondition}').matches) {\n${js
            .map((code) => `  ${code.replace(/\n/g, "\n  ")}`)
            .join("\n")}\n}`;
          allJS.push(deviceFilteredJS);
        }
      }
    }
  }

  return { css: allCSS, js: allJS };
};

export const generateKeyframeCSSAndJS = (editor: LexicalEditor) => {
  const { walkNodeWithWidgets, $isWPLexicalNode, $isAnimationNode } =
    getLazyImports();

  const allKeyframes: Record<string, any> = {};
  const allCSSArray: Set<string> = new Set();
  const allJSArray: Set<string> = new Set();

  walkNodeWithWidgets!(editor, (nestedEditor, node) => {
    nestedEditor.read(() => {
      if ($isAnimationNode!(node)) {
        const keyframes = node.getAllKeyFrames();
        for (const [name, frame] of Object.entries(keyframes)) {
          allKeyframes[name] = frame;
        }
        return;
      }

      if (!$isWPLexicalNode!(node)) {
        return;
      }

      // Generate and add CSS and JavaScript for animations in other nodes
      const { css, js } = nodeToAnimationStringCSSAndJS(node);

      if (css.length > 0) {
        css.forEach((rule) => allCSSArray.add(rule));
      }

      if (js.length > 0) {
        js.forEach((code) => allJSArray.add(code));
      }
    });
  });

  return {
    css: [...Object.values(allKeyframes), ...allCSSArray],
    js: Array.from(allJSArray),
  };
};
