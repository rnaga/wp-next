import type * as types from "../../types";
import { BREAKPOINTS, CSS_DEFAULT_DEVICE } from "./constants";

export const getMediaQueryMaxAndMin = (device: types.BreakpointDevice) => {
  const breakpoint = BREAKPOINTS[device];
  const smallerBreakpoint = Object.values(BREAKPOINTS).find(
    (value) => value < breakpoint
  );

  // Return empty if device is defaultDevice(desktop)
  // Return Max and Min media query if breakpoint is larger than desktop (1200px)
  // Return Max media query if breakpoint is smaller than desktop (1200px)
  return device === CSS_DEFAULT_DEVICE
    ? // Set for default device
      `@media screen and (min-width: ${breakpoint + 1}px)`
    : breakpoint > 1200 && smallerBreakpoint
      ? `@media screen and (max-width: ${breakpoint}px) and (min-width: ${
          smallerBreakpoint + 1
        }px)`
      : `@media screen and (max-width: ${breakpoint}px)`;
};
