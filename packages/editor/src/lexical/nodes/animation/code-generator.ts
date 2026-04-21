// /**
//  * Code Generator - Converts interaction rules to CSS/keyframes
//  */

// import type { AnimationRule, TriggerEvent } from "./types";
// import { ANIMATION_PRESETS } from "./presets";

// // Device breakpoints (matching Webflow-style breakpoints)
// // const DEVICE_BREAKPOINTS: Record<DeviceType, string> = {
// //   desktop: "@media (min-width: 992px)",
// //   tablet: "@media (min-width: 768px) and (max-width: 991px)",
// //   mobile: "@media (max-width: 767px)",
// // };

// // Map trigger events to CSS pseudo-classes/events
// const TRIGGER_TO_PSEUDO: Record<TriggerEvent, string> = {
//   click: "", // Click requires JavaScript, not a pseudo-class
//   dblclick: "", // Double-click requires JavaScript
//   mouseenter: ":hover",
//   mouseleave: "", // Mouse leave requires JavaScript or complex CSS
//   hover: ":hover",
//   focus: ":focus",
//   blur: "", // Blur requires JavaScript
//   scroll: "", // Scroll requires JavaScript
//   load: "", // Load requires JavaScript
// };

// /**
//  * Generate CSS animation properties from animation config
//  */
// function generateAnimationProperties(rule: AnimationRule): string {
//   const { animation } = rule;
//   const props: string[] = [];

//   // Animation name
//   props.push(`animation-name: ${animation.preset}`);

//   // Duration
//   props.push(`animation-duration: ${animation.duration}ms`);

//   // Delay
//   if (animation.delay && animation.delay > 0) {
//     props.push(`animation-delay: ${animation.delay}ms`);
//   }

//   // Timing function
//   if (animation.timingFunction) {
//     props.push(`animation-timing-function: ${animation.timingFunction}`);
//   }

//   // Iteration count
//   if (animation.iterationCount) {
//     props.push(`animation-iteration-count: ${animation.iterationCount}`);
//   }

//   // Direction
//   if (animation.direction) {
//     props.push(`animation-direction: ${animation.direction}`);
//   }

//   // Fill mode
//   if (animation.fillMode) {
//     props.push(`animation-fill-mode: ${animation.fillMode}`);
//   }

//   return props.join(";\n    ");
// }

// /**
//  * Generate CSS selector based on source, target, and trigger
//  */
// function generateSelector(rule: AnimationRule): string {
//   const { sourceElement, targetElement, trigger } = rule;
//   const pseudo = TRIGGER_TO_PSEUDO[trigger];

//   // If no target element, apply animation to source element
//   if (!targetElement || targetElement === sourceElement) {
//     return `.${sourceElement}${pseudo}`;
//   }

//   // If target element exists, use :has() selector
//   // This applies the animation to target element when source element is triggered
//   return `.body:has(.${sourceElement}${pseudo}) .${targetElement}`;
// }

// /**
//  * Generate complete CSS code for a single interaction rule
//  */
// export function generateRuleCSS(rule: AnimationRule): string {
//   const { animation } = rule;
//   const selector = generateSelector(rule);
//   const animationProps = generateAnimationProperties(rule);

//   // Get keyframe definition
//   const keyframeDef = ANIMATION_PRESETS[animation.preset];
//   const keyframes = keyframeDef.keyframes;

//   // Build the CSS
//   const css: string[] = [];

//   // Add keyframes
//   if (keyframes) {
//     css.push(keyframes);
//     css.push("");
//   }

//   // Wrap in media queries for each target device
//   // rule.targetDevices.forEach((device) => {
//   //   const mediaQuery = DEVICE_BREAKPOINTS[device];

//   //   css.push(`${mediaQuery} {`);
//   //   css.push(`  ${selector} {`);
//   //   css.push(`    ${animationProps};`);
//   //   css.push(`  }`);
//   //   css.push(`}`);
//   //   css.push("");
//   // });

//   return css.join("\n");
// }

// /**
//  * Generate CSS code for multiple interaction rules
//  */
// export function generateInteractionCSS(rules: AnimationRule[]): string {
//   // Collect all unique keyframes first to avoid duplicates
//   const usedKeyframes = new Set<string>();
//   const keyframesCSS: string[] = [];
//   const rulesCSS: string[] = [];

//   rules.forEach((rule) => {
//     const keyframeDef = ANIMATION_PRESETS[rule.animation.preset];

//     // Add keyframes if not already added
//     if (keyframeDef.keyframes && !usedKeyframes.has(rule.animation.preset)) {
//       keyframesCSS.push(keyframeDef.keyframes);
//       usedKeyframes.add(rule.animation.preset);
//     }

//     // Generate rule CSS (without keyframes)
//     const selector = generateSelector(rule);
//     const animationProps = generateAnimationProperties(rule);

//     // Wrap in media queries for each target device
//     // rule.targetDevices.forEach((device) => {
//     //   const mediaQuery = DEVICE_BREAKPOINTS[device];

//     //   rulesCSS.push(`${mediaQuery} {`);
//     //   rulesCSS.push(`  ${selector} {`);
//     //   rulesCSS.push(`    ${animationProps};`);
//     //   rulesCSS.push(`  }`);
//     //   rulesCSS.push(`}`);
//     // });
//   });

//   // Combine keyframes and rules
//   const css = [...keyframesCSS, "", ...rulesCSS].join("\n");

//   return css;
// }

// /**
//  * Helper to check if a trigger requires JavaScript
//  */
// export function requiresJavaScript(trigger: TriggerEvent): boolean {
//   return !TRIGGER_TO_PSEUDO[trigger];
// }

// /**
//  * Generate JavaScript event listener code for triggers that require it
//  */
// export function generateEventListenerJS(rule: AnimationRule): string | null {
//   if (!requiresJavaScript(rule.trigger)) {
//     return null;
//   }

//   const { sourceElement, targetElement, trigger, animation } = rule;
//   const target = targetElement || sourceElement;

//   const animationClass = `animate-${rule.id}`;

//   return `
// // Event listener for ${sourceElement} - ${trigger}
// document.querySelectorAll('.${sourceElement}').forEach(el => {
//   el.addEventListener('${trigger}', () => {
//     const targetEl = ${
//       targetElement ? `document.querySelector('.${target}')` : "el"
//     };
//     if (targetEl) {
//       targetEl.classList.add('${animationClass}');
//       setTimeout(() => {
//         targetEl.classList.remove('${animationClass}');
//       }, ${animation.duration + (animation.delay || 0)});
//     }
//   });
// });
// `.trim();
// }
