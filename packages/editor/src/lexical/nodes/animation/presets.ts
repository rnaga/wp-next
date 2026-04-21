/**
 * Animation Presets - Keyframe definitions based on Animate.css
 * Source: https://animate.style/
 */

import type { AnimationPreset } from "./types";

export interface KeyframeDefinition {
  name: string;
  keyframes: string;
}

export const ANIMATION_PRESETS: Record<AnimationPreset, KeyframeDefinition> = {
  // Attention Seekers
  bounce: {
    name: "bounce",
    keyframes: `@keyframes bounce {
  0%, 20%, 53%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0) scaleY(1.1);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0) scaleY(1.05);
  }
  80% {
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0) scaleY(0.95);
  }
  90% {
    transform: translate3d(0, -4px, 0) scaleY(1.02);
  }
}`,
  },
  flash: {
    name: "flash",
    keyframes: `@keyframes flash {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0;
  }
}`,
  },
  pulse: {
    name: "pulse",
    keyframes: `@keyframes pulse {
  0% {
    transform: scale3d(1, 1, 1);
  }
  50% {
    transform: scale3d(1.05, 1.05, 1.05);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}`,
  },
  rubberBand: {
    name: "rubberBand",
    keyframes: `@keyframes rubberBand {
  0% {
    transform: scale3d(1, 1, 1);
  }
  30% {
    transform: scale3d(1.25, 0.75, 1);
  }
  40% {
    transform: scale3d(0.75, 1.25, 1);
  }
  50% {
    transform: scale3d(1.15, 0.85, 1);
  }
  65% {
    transform: scale3d(0.95, 1.05, 1);
  }
  75% {
    transform: scale3d(1.05, 0.95, 1);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}`,
  },
  shakeX: {
    name: "shakeX",
    keyframes: `@keyframes shakeX {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translate3d(-10px, 0, 0);
  }
  20%, 40%, 60%, 80% {
    transform: translate3d(10px, 0, 0);
  }
}`,
  },
  shakeY: {
    name: "shakeY",
    keyframes: `@keyframes shakeY {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translate3d(0, -10px, 0);
  }
  20%, 40%, 60%, 80% {
    transform: translate3d(0, 10px, 0);
  }
}`,
  },
  headShake: {
    name: "headShake",
    keyframes: `@keyframes headShake {
  0% {
    transform: translateX(0);
  }
  6.5% {
    transform: translateX(-6px) rotateY(-9deg);
  }
  18.5% {
    transform: translateX(5px) rotateY(7deg);
  }
  31.5% {
    transform: translateX(-3px) rotateY(-5deg);
  }
  43.5% {
    transform: translateX(2px) rotateY(3deg);
  }
  50% {
    transform: translateX(0);
  }
}`,
  },
  swing: {
    name: "swing",
    keyframes: `@keyframes swing {
  20% {
    transform: rotate3d(0, 0, 1, 15deg);
  }
  40% {
    transform: rotate3d(0, 0, 1, -10deg);
  }
  60% {
    transform: rotate3d(0, 0, 1, 5deg);
  }
  80% {
    transform: rotate3d(0, 0, 1, -5deg);
  }
  100% {
    transform: rotate3d(0, 0, 1, 0deg);
  }
}`,
  },
  tada: {
    name: "tada",
    keyframes: `@keyframes tada {
  0% {
    transform: scale3d(1, 1, 1);
  }
  10%, 20% {
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
  }
  30%, 50%, 70%, 90% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
  }
  40%, 60%, 80% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}`,
  },
  wobble: {
    name: "wobble",
    keyframes: `@keyframes wobble {
  0% {
    transform: translate3d(0, 0, 0);
  }
  15% {
    transform: translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg);
  }
  30% {
    transform: translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg);
  }
  45% {
    transform: translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg);
  }
  60% {
    transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg);
  }
  75% {
    transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  jello: {
    name: "jello",
    keyframes: `@keyframes jello {
  0%, 11.1%, 100% {
    transform: translate3d(0, 0, 0);
  }
  22.2% {
    transform: skewX(-12.5deg) skewY(-12.5deg);
  }
  33.3% {
    transform: skewX(6.25deg) skewY(6.25deg);
  }
  44.4% {
    transform: skewX(-3.125deg) skewY(-3.125deg);
  }
  55.5% {
    transform: skewX(1.5625deg) skewY(1.5625deg);
  }
  66.6% {
    transform: skewX(-0.78125deg) skewY(-0.78125deg);
  }
  77.7% {
    transform: skewX(0.390625deg) skewY(0.390625deg);
  }
  88.8% {
    transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
  }
}`,
  },
  heartBeat: {
    name: "heartBeat",
    keyframes: `@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
}`,
  },

  // Back Entrances
  backInDown: {
    name: "backInDown",
    keyframes: `@keyframes backInDown {
  0% {
    transform: translateY(-1200px) scale(0.7);
    opacity: 0.7;
  }
  80% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },
  backInLeft: {
    name: "backInLeft",
    keyframes: `@keyframes backInLeft {
  0% {
    transform: translateX(-2000px) scale(0.7);
    opacity: 0.7;
  }
  80% {
    transform: translateX(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },
  backInRight: {
    name: "backInRight",
    keyframes: `@keyframes backInRight {
  0% {
    transform: translateX(2000px) scale(0.7);
    opacity: 0.7;
  }
  80% {
    transform: translateX(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },
  backInUp: {
    name: "backInUp",
    keyframes: `@keyframes backInUp {
  0% {
    transform: translateY(1200px) scale(0.7);
    opacity: 0.7;
  }
  80% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },

  // Back Exits
  backOutDown: {
    name: "backOutDown",
    keyframes: `@keyframes backOutDown {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  20% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: translateY(700px) scale(0.7);
    opacity: 0.7;
  }
}`,
  },
  backOutLeft: {
    name: "backOutLeft",
    keyframes: `@keyframes backOutLeft {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  20% {
    transform: translateX(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: translateX(-2000px) scale(0.7);
    opacity: 0.7;
  }
}`,
  },
  backOutRight: {
    name: "backOutRight",
    keyframes: `@keyframes backOutRight {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  20% {
    transform: translateX(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: translateX(2000px) scale(0.7);
    opacity: 0.7;
  }
}`,
  },
  backOutUp: {
    name: "backOutUp",
    keyframes: `@keyframes backOutUp {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  20% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-700px) scale(0.7);
    opacity: 0.7;
  }
}`,
  },

  // Bouncing Entrances
  bounceIn: {
    name: "bounceIn",
    keyframes: `@keyframes bounceIn {
  0%, 20%, 40%, 60%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  20% {
    transform: scale3d(1.1, 1.1, 1.1);
  }
  40% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  60% {
    opacity: 1;
    transform: scale3d(1.03, 1.03, 1.03);
  }
  80% {
    transform: scale3d(0.97, 0.97, 0.97);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}`,
  },
  bounceInDown: {
    name: "bounceInDown",
    keyframes: `@keyframes bounceInDown {
  0%, 60%, 75%, 90%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(0, -3000px, 0) scaleY(3);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, 25px, 0) scaleY(0.9);
  }
  75% {
    transform: translate3d(0, -10px, 0) scaleY(0.95);
  }
  90% {
    transform: translate3d(0, 5px, 0) scaleY(0.985);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  bounceInLeft: {
    name: "bounceInLeft",
    keyframes: `@keyframes bounceInLeft {
  0%, 60%, 75%, 90%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(-3000px, 0, 0) scaleX(3);
  }
  60% {
    opacity: 1;
    transform: translate3d(25px, 0, 0) scaleX(1);
  }
  75% {
    transform: translate3d(-10px, 0, 0) scaleX(0.98);
  }
  90% {
    transform: translate3d(5px, 0, 0) scaleX(0.995);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  bounceInRight: {
    name: "bounceInRight",
    keyframes: `@keyframes bounceInRight {
  0%, 60%, 75%, 90%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(3000px, 0, 0) scaleX(3);
  }
  60% {
    opacity: 1;
    transform: translate3d(-25px, 0, 0) scaleX(1);
  }
  75% {
    transform: translate3d(10px, 0, 0) scaleX(0.98);
  }
  90% {
    transform: translate3d(-5px, 0, 0) scaleX(0.995);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  bounceInUp: {
    name: "bounceInUp",
    keyframes: `@keyframes bounceInUp {
  0%, 60%, 75%, 90%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(0, 3000px, 0) scaleY(5);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, -20px, 0) scaleY(0.9);
  }
  75% {
    transform: translate3d(0, 10px, 0) scaleY(0.95);
  }
  90% {
    transform: translate3d(0, -5px, 0) scaleY(0.985);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // Bouncing Exits
  bounceOut: {
    name: "bounceOut",
    keyframes: `@keyframes bounceOut {
  20% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  50%, 55% {
    opacity: 1;
    transform: scale3d(1.1, 1.1, 1.1);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
}`,
  },
  bounceOutDown: {
    name: "bounceOutDown",
    keyframes: `@keyframes bounceOutDown {
  20% {
    transform: translate3d(0, 10px, 0) scaleY(0.985);
  }
  40%, 45% {
    opacity: 1;
    transform: translate3d(0, -20px, 0) scaleY(0.9);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 2000px, 0) scaleY(3);
  }
}`,
  },
  bounceOutLeft: {
    name: "bounceOutLeft",
    keyframes: `@keyframes bounceOutLeft {
  20% {
    opacity: 1;
    transform: translate3d(20px, 0, 0) scaleX(0.9);
  }
  100% {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0) scaleX(2);
  }
}`,
  },
  bounceOutRight: {
    name: "bounceOutRight",
    keyframes: `@keyframes bounceOutRight {
  20% {
    opacity: 1;
    transform: translate3d(-20px, 0, 0) scaleX(0.9);
  }
  100% {
    opacity: 0;
    transform: translate3d(2000px, 0, 0) scaleX(2);
  }
}`,
  },
  bounceOutUp: {
    name: "bounceOutUp",
    keyframes: `@keyframes bounceOutUp {
  20% {
    transform: translate3d(0, -10px, 0) scaleY(0.985);
  }
  40%, 45% {
    opacity: 1;
    transform: translate3d(0, 20px, 0) scaleY(0.9);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -2000px, 0) scaleY(3);
  }
}`,
  },

  // Fading Entrances
  fadeIn: {
    name: "fadeIn",
    keyframes: `@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}`,
  },
  fadeInDown: {
    name: "fadeInDown",
    keyframes: `@keyframes fadeInDown {
  0% {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInDownBig: {
    name: "fadeInDownBig",
    keyframes: `@keyframes fadeInDownBig {
  0% {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInLeft: {
    name: "fadeInLeft",
    keyframes: `@keyframes fadeInLeft {
  0% {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInLeftBig: {
    name: "fadeInLeftBig",
    keyframes: `@keyframes fadeInLeftBig {
  0% {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInRight: {
    name: "fadeInRight",
    keyframes: `@keyframes fadeInRight {
  0% {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInRightBig: {
    name: "fadeInRightBig",
    keyframes: `@keyframes fadeInRightBig {
  0% {
    opacity: 0;
    transform: translate3d(2000px, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInUp: {
    name: "fadeInUp",
    keyframes: `@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInUpBig: {
    name: "fadeInUpBig",
    keyframes: `@keyframes fadeInUpBig {
  0% {
    opacity: 0;
    transform: translate3d(0, 2000px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInTopLeft: {
    name: "fadeInTopLeft",
    keyframes: `@keyframes fadeInTopLeft {
  0% {
    opacity: 0;
    transform: translate3d(-100%, -100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInTopRight: {
    name: "fadeInTopRight",
    keyframes: `@keyframes fadeInTopRight {
  0% {
    opacity: 0;
    transform: translate3d(100%, -100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInBottomLeft: {
    name: "fadeInBottomLeft",
    keyframes: `@keyframes fadeInBottomLeft {
  0% {
    opacity: 0;
    transform: translate3d(-100%, 100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  fadeInBottomRight: {
    name: "fadeInBottomRight",
    keyframes: `@keyframes fadeInBottomRight {
  0% {
    opacity: 0;
    transform: translate3d(100%, 100%, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // Fading Exits
  fadeOut: {
    name: "fadeOut",
    keyframes: `@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}`,
  },
  fadeOutDown: {
    name: "fadeOutDown",
    keyframes: `@keyframes fadeOutDown {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }
}`,
  },
  fadeOutDownBig: {
    name: "fadeOutDownBig",
    keyframes: `@keyframes fadeOutDownBig {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 2000px, 0);
  }
}`,
  },
  fadeOutLeft: {
    name: "fadeOutLeft",
    keyframes: `@keyframes fadeOutLeft {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
}`,
  },
  fadeOutLeftBig: {
    name: "fadeOutLeftBig",
    keyframes: `@keyframes fadeOutLeftBig {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0);
  }
}`,
  },
  fadeOutRight: {
    name: "fadeOutRight",
    keyframes: `@keyframes fadeOutRight {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }
}`,
  },
  fadeOutRightBig: {
    name: "fadeOutRightBig",
    keyframes: `@keyframes fadeOutRightBig {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(2000px, 0, 0);
  }
}`,
  },
  fadeOutUp: {
    name: "fadeOutUp",
    keyframes: `@keyframes fadeOutUp {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
  }
}`,
  },
  fadeOutUpBig: {
    name: "fadeOutUpBig",
    keyframes: `@keyframes fadeOutUpBig {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }
}`,
  },
  fadeOutTopLeft: {
    name: "fadeOutTopLeft",
    keyframes: `@keyframes fadeOutTopLeft {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(-100%, -100%, 0);
  }
}`,
  },
  fadeOutTopRight: {
    name: "fadeOutTopRight",
    keyframes: `@keyframes fadeOutTopRight {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(100%, -100%, 0);
  }
}`,
  },
  fadeOutBottomRight: {
    name: "fadeOutBottomRight",
    keyframes: `@keyframes fadeOutBottomRight {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(100%, 100%, 0);
  }
}`,
  },
  fadeOutBottomLeft: {
    name: "fadeOutBottomLeft",
    keyframes: `@keyframes fadeOutBottomLeft {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(-100%, 100%, 0);
  }
}`,
  },

  // Rotating Entrances
  rotateIn: {
    name: "rotateIn",
    keyframes: `@keyframes rotateIn {
  0% {
    transform: rotate3d(0, 0, 1, -200deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}`,
  },
  rotateInDownLeft: {
    name: "rotateInDownLeft",
    keyframes: `@keyframes rotateInDownLeft {
  0% {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}`,
  },
  rotateInDownRight: {
    name: "rotateInDownRight",
    keyframes: `@keyframes rotateInDownRight {
  0% {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}`,
  },
  rotateInUpLeft: {
    name: "rotateInUpLeft",
    keyframes: `@keyframes rotateInUpLeft {
  0% {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}`,
  },
  rotateInUpRight: {
    name: "rotateInUpRight",
    keyframes: `@keyframes rotateInUpRight {
  0% {
    transform: rotate3d(0, 0, 1, -90deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}`,
  },

  // Rotating Exits
  rotateOut: {
    name: "rotateOut",
    keyframes: `@keyframes rotateOut {
  0% {
    opacity: 1;
  }
  100% {
    transform: rotate3d(0, 0, 1, 200deg);
    opacity: 0;
  }
}`,
  },
  rotateOutDownLeft: {
    name: "rotateOutDownLeft",
    keyframes: `@keyframes rotateOutDownLeft {
  0% {
    opacity: 1;
  }
  100% {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }
}`,
  },
  rotateOutDownRight: {
    name: "rotateOutDownRight",
    keyframes: `@keyframes rotateOutDownRight {
  0% {
    opacity: 1;
  }
  100% {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }
}`,
  },
  rotateOutUpLeft: {
    name: "rotateOutUpLeft",
    keyframes: `@keyframes rotateOutUpLeft {
  0% {
    opacity: 1;
  }
  100% {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }
}`,
  },
  rotateOutUpRight: {
    name: "rotateOutUpRight",
    keyframes: `@keyframes rotateOutUpRight {
  0% {
    opacity: 1;
  }
  100% {
    transform: rotate3d(0, 0, 1, 90deg);
    opacity: 0;
  }
}`,
  },

  // Zooming Entrances
  zoomIn: {
    name: "zoomIn",
    keyframes: `@keyframes zoomIn {
  0% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  50% {
    opacity: 1;
  }
}`,
  },
  zoomInDown: {
    name: "zoomInDown",
    keyframes: `@keyframes zoomInDown {
  0% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -1000px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },
  zoomInLeft: {
    name: "zoomInLeft",
    keyframes: `@keyframes zoomInLeft {
  0% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(-1000px, 0, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(10px, 0, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },
  zoomInRight: {
    name: "zoomInRight",
    keyframes: `@keyframes zoomInRight {
  0% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(1000px, 0, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(-10px, 0, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },
  zoomInUp: {
    name: "zoomInUp",
    keyframes: `@keyframes zoomInUp {
  0% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 1000px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },

  // Zooming Exits
  zoomOut: {
    name: "zoomOut",
    keyframes: `@keyframes zoomOut {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  100% {
    opacity: 0;
  }
}`,
  },
  zoomOutDown: {
    name: "zoomOutDown",
    keyframes: `@keyframes zoomOutDown {
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 2000px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },
  zoomOutLeft: {
    name: "zoomOutLeft",
    keyframes: `@keyframes zoomOutLeft {
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(42px, 0, 0);
  }
  100% {
    opacity: 0;
    transform: scale(0.1) translate3d(-2000px, 0, 0);
  }
}`,
  },
  zoomOutRight: {
    name: "zoomOutRight",
    keyframes: `@keyframes zoomOutRight {
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(-42px, 0, 0);
  }
  100% {
    opacity: 0;
    transform: scale(0.1) translate3d(2000px, 0, 0);
  }
}`,
  },
  zoomOutUp: {
    name: "zoomOutUp",
    keyframes: `@keyframes zoomOutUp {
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -2000px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}`,
  },

  // Sliding Entrances
  slideInDown: {
    name: "slideInDown",
    keyframes: `@keyframes slideInDown {
  0% {
    transform: translate3d(0, -100%, 0);
    visibility: visible;
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  slideInLeft: {
    name: "slideInLeft",
    keyframes: `@keyframes slideInLeft {
  0% {
    transform: translate3d(-100%, 0, 0);
    visibility: visible;
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  slideInRight: {
    name: "slideInRight",
    keyframes: `@keyframes slideInRight {
  0% {
    transform: translate3d(100%, 0, 0);
    visibility: visible;
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  slideInUp: {
    name: "slideInUp",
    keyframes: `@keyframes slideInUp {
  0% {
    transform: translate3d(0, 100%, 0);
    visibility: visible;
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // Sliding Exits
  slideOutDown: {
    name: "slideOutDown",
    keyframes: `@keyframes slideOutDown {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    visibility: hidden;
    transform: translate3d(0, 100%, 0);
  }
}`,
  },
  slideOutLeft: {
    name: "slideOutLeft",
    keyframes: `@keyframes slideOutLeft {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    visibility: hidden;
    transform: translate3d(-100%, 0, 0);
  }
}`,
  },
  slideOutRight: {
    name: "slideOutRight",
    keyframes: `@keyframes slideOutRight {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    visibility: hidden;
    transform: translate3d(100%, 0, 0);
  }
}`,
  },
  slideOutUp: {
    name: "slideOutUp",
    keyframes: `@keyframes slideOutUp {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    visibility: hidden;
    transform: translate3d(0, -100%, 0);
  }
}`,
  },

  // Flippers
  flip: {
    name: "flip",
    keyframes: `@keyframes flip {
  0% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, -360deg);
    animation-timing-function: ease-out;
  }
  40% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px) rotate3d(0, 1, 0, -190deg);
    animation-timing-function: ease-out;
  }
  50% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px) rotate3d(0, 1, 0, -170deg);
    animation-timing-function: ease-in;
  }
  80% {
    transform: perspective(400px) scale3d(0.95, 0.95, 0.95) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg);
    animation-timing-function: ease-in;
  }
  100% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg);
    animation-timing-function: ease-in;
  }
}`,
  },
  flipInX: {
    name: "flipInX",
    keyframes: `@keyframes flipInX {
  0% {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    animation-timing-function: ease-in;
    opacity: 0;
  }
  40% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    animation-timing-function: ease-in;
  }
  60% {
    transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
    opacity: 1;
  }
  80% {
    transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
  }
  100% {
    transform: perspective(400px);
  }
}`,
  },
  flipInY: {
    name: "flipInY",
    keyframes: `@keyframes flipInY {
  0% {
    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);
    animation-timing-function: ease-in;
    opacity: 0;
  }
  40% {
    transform: perspective(400px) rotate3d(0, 1, 0, -20deg);
    animation-timing-function: ease-in;
  }
  60% {
    transform: perspective(400px) rotate3d(0, 1, 0, 10deg);
    opacity: 1;
  }
  80% {
    transform: perspective(400px) rotate3d(0, 1, 0, -5deg);
  }
  100% {
    transform: perspective(400px);
  }
}`,
  },
  flipOutX: {
    name: "flipOutX",
    keyframes: `@keyframes flipOutX {
  0% {
    transform: perspective(400px);
  }
  30% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    opacity: 1;
  }
  100% {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    opacity: 0;
  }
}`,
  },
  flipOutY: {
    name: "flipOutY",
    keyframes: `@keyframes flipOutY {
  0% {
    transform: perspective(400px);
  }
  30% {
    transform: perspective(400px) rotate3d(0, 1, 0, -15deg);
    opacity: 1;
  }
  100% {
    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);
    opacity: 0;
  }
}`,
  },

  // Lightspeed
  lightSpeedInRight: {
    name: "lightSpeedInRight",
    keyframes: `@keyframes lightSpeedInRight {
  0% {
    transform: translate3d(100%, 0, 0) skewX(-30deg);
    opacity: 0;
  }
  60% {
    transform: skewX(20deg);
    opacity: 1;
  }
  80% {
    transform: skewX(-5deg);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  lightSpeedInLeft: {
    name: "lightSpeedInLeft",
    keyframes: `@keyframes lightSpeedInLeft {
  0% {
    transform: translate3d(-100%, 0, 0) skewX(30deg);
    opacity: 0;
  }
  60% {
    transform: skewX(-20deg);
    opacity: 1;
  }
  80% {
    transform: skewX(5deg);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  lightSpeedOutRight: {
    name: "lightSpeedOutRight",
    keyframes: `@keyframes lightSpeedOutRight {
  0% {
    opacity: 1;
  }
  100% {
    transform: translate3d(100%, 0, 0) skewX(30deg);
    opacity: 0;
  }
}`,
  },
  lightSpeedOutLeft: {
    name: "lightSpeedOutLeft",
    keyframes: `@keyframes lightSpeedOutLeft {
  0% {
    opacity: 1;
  }
  100% {
    transform: translate3d(-100%, 0, 0) skewX(-30deg);
    opacity: 0;
  }
}`,
  },

  // Specials
  hinge: {
    name: "hinge",
    keyframes: `@keyframes hinge {
  0% {
    animation-timing-function: ease-in-out;
  }
  20%, 60% {
    transform: rotate3d(0, 0, 1, 80deg);
    animation-timing-function: ease-in-out;
  }
  40%, 80% {
    transform: rotate3d(0, 0, 1, 60deg);
    animation-timing-function: ease-in-out;
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 700px, 0);
    opacity: 0;
  }
}`,
  },
  jackInTheBox: {
    name: "jackInTheBox",
    keyframes: `@keyframes jackInTheBox {
  0% {
    opacity: 0;
    transform: scale(0.1) rotate(30deg);
    transform-origin: center bottom;
  }
  50% {
    transform: rotate(-10deg);
  }
  70% {
    transform: rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}`,
  },
  rollIn: {
    name: "rollIn",
    keyframes: `@keyframes rollIn {
  0% {
    opacity: 0;
    transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },
  rollOut: {
    name: "rollOut",
    keyframes: `@keyframes rollOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg);
  }
}`,
  },

  // Custom (placeholder - user will define their own)
  custom: {
    name: "custom",
    keyframes: "",
  },
};

// Helper to group animations by category
export const ANIMATION_CATEGORIES = {
  "Attention Seekers": [
    "bounce",
    "flash",
    "pulse",
    "rubberBand",
    "shakeX",
    "shakeY",
    "headShake",
    "swing",
    "tada",
    "wobble",
    "jello",
    "heartBeat",
  ] as AnimationPreset[],
  "Back Entrances": [
    "backInDown",
    "backInLeft",
    "backInRight",
    "backInUp",
  ] as AnimationPreset[],
  "Back Exits": [
    "backOutDown",
    "backOutLeft",
    "backOutRight",
    "backOutUp",
  ] as AnimationPreset[],
  "Bouncing Entrances": [
    "bounceIn",
    "bounceInDown",
    "bounceInLeft",
    "bounceInRight",
    "bounceInUp",
  ] as AnimationPreset[],
  "Bouncing Exits": [
    "bounceOut",
    "bounceOutDown",
    "bounceOutLeft",
    "bounceOutRight",
    "bounceOutUp",
  ] as AnimationPreset[],
  "Fading Entrances": [
    "fadeIn",
    "fadeInDown",
    "fadeInDownBig",
    "fadeInLeft",
    "fadeInLeftBig",
    "fadeInRight",
    "fadeInRightBig",
    "fadeInUp",
    "fadeInUpBig",
    "fadeInTopLeft",
    "fadeInTopRight",
    "fadeInBottomLeft",
    "fadeInBottomRight",
  ] as AnimationPreset[],
  "Fading Exits": [
    "fadeOut",
    "fadeOutDown",
    "fadeOutDownBig",
    "fadeOutLeft",
    "fadeOutLeftBig",
    "fadeOutRight",
    "fadeOutRightBig",
    "fadeOutUp",
    "fadeOutUpBig",
    "fadeOutTopLeft",
    "fadeOutTopRight",
    "fadeOutBottomRight",
    "fadeOutBottomLeft",
  ] as AnimationPreset[],
  "Rotating Entrances": [
    "rotateIn",
    "rotateInDownLeft",
    "rotateInDownRight",
    "rotateInUpLeft",
    "rotateInUpRight",
  ] as AnimationPreset[],
  "Rotating Exits": [
    "rotateOut",
    "rotateOutDownLeft",
    "rotateOutDownRight",
    "rotateOutUpLeft",
    "rotateOutUpRight",
  ] as AnimationPreset[],
  "Zooming Entrances": [
    "zoomIn",
    "zoomInDown",
    "zoomInLeft",
    "zoomInRight",
    "zoomInUp",
  ] as AnimationPreset[],
  "Zooming Exits": [
    "zoomOut",
    "zoomOutDown",
    "zoomOutLeft",
    "zoomOutRight",
    "zoomOutUp",
  ] as AnimationPreset[],
  "Sliding Entrances": [
    "slideInDown",
    "slideInLeft",
    "slideInRight",
    "slideInUp",
  ] as AnimationPreset[],
  "Sliding Exits": [
    "slideOutDown",
    "slideOutLeft",
    "slideOutRight",
    "slideOutUp",
  ] as AnimationPreset[],
  Flippers: [
    "flip",
    "flipInX",
    "flipInY",
    "flipOutX",
    "flipOutY",
  ] as AnimationPreset[],
  Lightspeed: [
    "lightSpeedInRight",
    "lightSpeedInLeft",
    "lightSpeedOutRight",
    "lightSpeedOutLeft",
  ] as AnimationPreset[],
  Specials: ["hinge", "jackInTheBox", "rollIn", "rollOut"] as AnimationPreset[],
  Custom: ["custom"] as AnimationPreset[],
};
