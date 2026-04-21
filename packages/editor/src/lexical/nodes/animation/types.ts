/**
 * Animation/Interaction System Types
 * Based on Webflow-style interactions
 */

export type TriggerEvent =
  | "click"
  | "dblclick"
  | "mouseenter"
  | "mouseleave"
  | "hover"
  | "focus"
  | "blur"
  | "scroll"
  | "load";

export type AnimationPreset =
  // Attention Seekers
  | "bounce"
  | "flash"
  | "pulse"
  | "rubberBand"
  | "shakeX"
  | "shakeY"
  | "headShake"
  | "swing"
  | "tada"
  | "wobble"
  | "jello"
  | "heartBeat"
  // Back Entrances
  | "backInDown"
  | "backInLeft"
  | "backInRight"
  | "backInUp"
  // Back Exits
  | "backOutDown"
  | "backOutLeft"
  | "backOutRight"
  | "backOutUp"
  // Bouncing Entrances
  | "bounceIn"
  | "bounceInDown"
  | "bounceInLeft"
  | "bounceInRight"
  | "bounceInUp"
  // Bouncing Exits
  | "bounceOut"
  | "bounceOutDown"
  | "bounceOutLeft"
  | "bounceOutRight"
  | "bounceOutUp"
  // Fading Entrances
  | "fadeIn"
  | "fadeInDown"
  | "fadeInDownBig"
  | "fadeInLeft"
  | "fadeInLeftBig"
  | "fadeInRight"
  | "fadeInRightBig"
  | "fadeInUp"
  | "fadeInUpBig"
  | "fadeInTopLeft"
  | "fadeInTopRight"
  | "fadeInBottomLeft"
  | "fadeInBottomRight"
  // Fading Exits
  | "fadeOut"
  | "fadeOutDown"
  | "fadeOutDownBig"
  | "fadeOutLeft"
  | "fadeOutLeftBig"
  | "fadeOutRight"
  | "fadeOutRightBig"
  | "fadeOutUp"
  | "fadeOutUpBig"
  | "fadeOutTopLeft"
  | "fadeOutTopRight"
  | "fadeOutBottomRight"
  | "fadeOutBottomLeft"
  // Rotating Entrances
  | "rotateIn"
  | "rotateInDownLeft"
  | "rotateInDownRight"
  | "rotateInUpLeft"
  | "rotateInUpRight"
  // Rotating Exits
  | "rotateOut"
  | "rotateOutDownLeft"
  | "rotateOutDownRight"
  | "rotateOutUpLeft"
  | "rotateOutUpRight"
  // Zooming Entrances
  | "zoomIn"
  | "zoomInDown"
  | "zoomInLeft"
  | "zoomInRight"
  | "zoomInUp"
  // Zooming Exits
  | "zoomOut"
  | "zoomOutDown"
  | "zoomOutLeft"
  | "zoomOutRight"
  | "zoomOutUp"
  // Sliding Entrances
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight"
  | "slideInUp"
  // Sliding Exits
  | "slideOutDown"
  | "slideOutLeft"
  | "slideOutRight"
  | "slideOutUp"
  // Flippers
  | "flip"
  | "flipInX"
  | "flipInY"
  | "flipOutX"
  | "flipOutY"
  // Lightspeed
  | "lightSpeedInRight"
  | "lightSpeedInLeft"
  | "lightSpeedOutRight"
  | "lightSpeedOutLeft"
  // Specials
  | "hinge"
  | "jackInTheBox"
  | "rollIn"
  | "rollOut"
  // Custom
  | "custom";

export type AnimationConfig = {
  keyframe: string; // preset name or custom keyframe name
  duration: number; // in milliseconds
  delay?: number; // in milliseconds
  timingFunction?: string; // e.g., 'ease-in-out', 'cubic-bezier(0.1, 0.7, 1.0, 0.1)'
  iterationCount?: number | "infinite";
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode?: "none" | "forwards" | "backwards" | "both";
  customCSS?: Record<string, any>; // For custom animations
};

export interface AnimationRule {
  id: string;
  sourceElement: string; // CSS class name
  targetElement?: string; // CSS class name (optional, defaults to sourceElement)
  // Optional pseudo-element to animate instead of the element itself (e.g., "::after", "::before").
  pseudoElement?: string;
  // Optional extra CSS properties written into the animation rule block alongside
  // the animation shorthand. Keyed by CSS property name (e.g., { "content": '""', "position": "absolute" }).
  customProperties?: Record<string, string>;
  trigger: TriggerEvent;
  animation: AnimationConfig;
}

export interface AnimationFormData {
  rules: AnimationRule[];
}
