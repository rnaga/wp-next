import type * as types from "../../types";

// Default styles for different breakpoint devices
export const DEFAULT_STYLES: Record<
  types.BreakpointDevice,
  types.CSSKeyValue | undefined
> = {
  desktop: undefined,
  // largeDesktop: undefined,
  tablet: undefined,
  mobile: undefined,
};

export const CSS_DEFAULT_DEVICE = "desktop";

export const CSS_VARIABLES_OBJECT_KEYS = ["transform"] as const;

export const STYLE_DEVICES = Object.keys(
  DEFAULT_STYLES
) as types.BreakpointDevice[];

export const BREAKPOINTS: Record<types.BreakpointDevice, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

export const CSS_CUSTOM_PROPERTIES_KEY = "__customProperties" as const;

export const CSS_EXTERNAL_CLASS_NAMES_KEY = "__externalClassNames" as const;

export const CSS_SPECIAL_KEYS: string[] = [
  CSS_CUSTOM_PROPERTIES_KEY,
  CSS_EXTERNAL_CLASS_NAMES_KEY,
];
