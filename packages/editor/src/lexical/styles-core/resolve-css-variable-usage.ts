import type * as types from "../../types";
import { cloneStyle } from "./clone-style";
import { isSpecialStyleKey } from "./is-special-style-key";

/**
 * Resolves CSS variable usage against CSS key-values.
 *
 * Logic for each key:
 * - If usageKey exists and cssKey doesn't: usageKey is taken over
 * - If usageKey exists and cssKey exists, but inherit is true: exclude usageKey
 * - If usageKey exists and cssKey exists, and inherit is false: take usageKey, remove cssKey
 * - If usageKey doesn't exist and cssKey does: take cssKey
 */
export const resolveCSSVariableUsage = (
  style: Readonly<types.CSSKeyValue>
): types.CSSKeyValue => {
  const clonedStyle = cloneStyle(style) as types.CSSKeyValue;
  const usage = clonedStyle.__cssVariablesUsage as
    | types.CSSVariablesUsage
    | undefined;

  // If no usage exists, return cloned style as-is
  if (!usage) {
    return clonedStyle;
  }

  const result: types.CSSKeyValue = {};
  const resolvedUsage: types.CSSVariablesUsage = {};

  // Collect all keys from both style and usage (excluding special keys)
  const styleKeys = Object.keys(clonedStyle).filter(
    (key) => !isSpecialStyleKey(key)
  );
  const usageKeys = Object.keys(usage);
  const allKeys = new Set([...styleKeys, ...usageKeys]);

  for (const key of allKeys) {
    const cssKeyExists = key in clonedStyle && !isSpecialStyleKey(key);
    const usageKeyExists = key in usage;

    if (usageKeyExists && !cssKeyExists) {
      // Case 1: usageKey exists, cssKey doesn't -> take usageKey
      resolvedUsage[key] = usage[key];
    } else if (usageKeyExists && cssKeyExists) {
      const usageValue = usage[key];
      if (usageValue.inherit === true) {
        // Case 2: both exist, inherit is true -> exclude usageKey, take cssKey
        result[key as keyof types.CSSKeyValue] =
          clonedStyle[key as keyof types.CSSKeyValue];
      } else {
        // Case 3: both exist, inherit is false -> take usageKey, remove cssKey
        resolvedUsage[key] = usageValue;

        // The value can be array. When so, both values should be taken.
        if (Array.isArray(usageValue)) {
          result[key as keyof types.CSSKeyValue] =
            clonedStyle[key as keyof types.CSSKeyValue];
          continue;
        }
      }
    } else if (!usageKeyExists && cssKeyExists) {
      // Case 4: cssKey exists, usageKey doesn't -> take cssKey
      result[key as keyof types.CSSKeyValue] =
        clonedStyle[key as keyof types.CSSKeyValue];
    }
  }

  // Copy special keys from original style
  for (const key of Object.keys(clonedStyle)) {
    if (isSpecialStyleKey(key) && key !== "__cssVariablesUsage") {
      result[key as keyof types.CSSKeyValue] =
        clonedStyle[key as keyof types.CSSKeyValue];
    }
  }

  // Only add __cssVariablesUsage if there are resolved usage entries
  if (Object.keys(resolvedUsage).length > 0) {
    result.__cssVariablesUsage = resolvedUsage;
  }

  return result;
};
