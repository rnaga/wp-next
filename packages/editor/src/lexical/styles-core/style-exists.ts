import { CSS_SPECIAL_KEYS } from "./constants";

import type * as types from "../../types";
import { isSpecialStyleKey } from "./is-special-style-key";

export const styleExists = (
  style: types.CSSKeyValue | undefined | null,
  targetKey: keyof types.CSSKeyValue
): boolean => {
  if (style === undefined || style === null || isSpecialStyleKey(targetKey)) {
    return false;
  }

  for (const key of Object.keys(style) as Array<keyof types.CSSKeyValue>) {
    // Skip __cssVariablesUsage, and CSS_SPECIAL_KEYS, and some others
    if (isSpecialStyleKey(key)) {
      continue;
    }

    if (key.startsWith("__")) {
      if (styleExists(style[key] as types.CSSKeyValue, targetKey)) {
        return true;
      }
      continue;
    }

    if (key === targetKey) {
      return true;
    }
  }

  return false;
};
