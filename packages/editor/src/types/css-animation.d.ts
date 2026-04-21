export type CSSAnimationType = "presets" | "custom";

export type CSSAnimation = {
  $id: string;
  $type: CSSAnimationType;
  $keyframeName: string;
  $triggerEvent: string;
  $targetElement?: string;
  // Optional pseudo-element to append to the selector (e.g., "::after", "::before").
  // When set, the animation CSS is applied to the pseudo-element rather than the element itself.
  $pseudoElement?: string;
  // Optional extra CSS properties injected into the animation rule block alongside
  // the animation shorthand (e.g., content, position, inset for ::after overlays).
  $customProperties?: Record<string, string>;
  $duration: string;
  $timingFunction: string;
  $delay: string;
  $iterationCount: string;
  $direction: string;
  $fillMode: string;
  $playState: string;
};
