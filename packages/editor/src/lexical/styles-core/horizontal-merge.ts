import type * as types from "../../types";
import {
  cssVariableUsageKeyType,
  getCSSVariablesUsageObjectKey,
} from "../nodes/css-variables/CSSVariablesNode";
import { mergeCustomProperties } from "../styles/custom-properties";
import { cloneStyle } from "./clone-style";
import { cssVariableUsageExists } from "./css-variable-usage-exists";
import { isSpecialStyleKey } from "./is-special-style-key";
import { isStyleObject } from "./is-style-object";
import { styleExists } from "./style-exists";

const mergeCssVariablesUsage = (
  noneUsage: Readonly<types.CSSVariablesUsageMixed> | undefined,
  stateUsage: Readonly<types.CSSVariablesUsageMixed> | undefined,
  stateStyleClone: Readonly<types.CSSKeyValue>
): types.CSSVariablesUsageMixed | undefined => {
  if (!noneUsage) {
    return stateUsage ? { ...stateUsage } : undefined;
  }

  const result: types.CSSVariablesUsageMixed = stateUsage
    ? { ...stateUsage }
    : {};

  for (const noneUsageKey of Object.keys(noneUsage)) {
    // Check for object value. e.g. tranform-rotate
    const objectKey = getCSSVariablesUsageObjectKey(noneUsageKey);

    // objectKey looks like "tranform" - need to check with %transform in style
    if (objectKey && styleExists(stateStyleClone, `%${objectKey}`)) {
      // If state style already has this CSS property, skip
      continue;
    }

    if (styleExists(stateStyleClone, noneUsageKey as keyof types.CSSKeyValue)) {
      // If state style already has this CSS property, skip
      continue;
    }

    if (cssVariableUsageExists(stateStyleClone, noneUsageKey)) {
      // If state style's CSS variable usage already has this key, skip
      continue;
    }

    // Only copy if key doesn't exist in both stateStyleClone and stateUsage
    // Set inherit: true because this CSS variable usage is inherited from "none" state
    const noneValue = noneUsage[noneUsageKey];
    if (
      cssVariableUsageKeyType(noneUsageKey) === "array" &&
      Array.isArray(noneValue)
    ) {
      result[noneUsageKey] = noneValue.map((item) => ({
        ...item,
        inherit: true,
      }));
    } else {
      result[noneUsageKey] = { ...noneValue, inherit: true };
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

// Merge "none" state style into other state styles
// Note: this function must be called with styles that have been merged vertically already.
// for mobile, styles should be merged like:
//   desktop "none" -> mobile "none"  => merged "none" style
//   desktop "hover" -> mobile "hover" => merged "hover" style
export const horizontalMerge = (
  noneStyle: Readonly<types.CSSKeyValue>,
  stateStyle: Readonly<types.CSSKeyValue>,
  options?: {
    shouldMergeCustomProperties?: boolean;
  }
): types.CSSKeyValue => {
  const result = cloneStyle(stateStyle) as types.CSSKeyValue;
  const noneStyleClone = cloneStyle(noneStyle) as types.CSSKeyValue;
  const shouldMergeCustomProperties =
    options?.shouldMergeCustomProperties ?? false;

  // __cssVariablesUsage is also merged separately
  delete result.__cssVariablesUsage;

  // __customProperties is also merged separately
  delete result.__customProperties;

  for (const _object of Object.entries(noneStyleClone)) {
    const [key, noneValue] = _object as [keyof types.CSSKeyValue, unknown];

    // Skip special keys - they are handled separately
    if (isSpecialStyleKey(key)) {
      continue;
    }

    if (key.startsWith("__") && isStyleObject(noneValue)) {
      // Merge nested objects
      const stateValue = result[key] || {};
      result[key] = horizontalMerge(
        noneValue as types.CSSKeyValue,
        stateValue as types.CSSKeyValue
      );
    } else if (!result[key] && !cssVariableUsageExists(stateStyle, key)) {
      // Note: if stateStyle has the same key or cssVariablesUsage, don't override it
      result[key] = noneValue;
    }
  }

  // Merge cssVariablesUsage from noneStyle into stateStyleClone
  const mergedCssVariablesUsage = mergeCssVariablesUsage(
    noneStyle.__cssVariablesUsage,
    stateStyle.__cssVariablesUsage,
    cloneStyle(stateStyle)
  );

  if (mergedCssVariablesUsage) {
    result.__cssVariablesUsage = mergedCssVariablesUsage;
  }

  // Merge __customProperties from noneStyle into stateStyleClone
  if (
    shouldMergeCustomProperties &&
    (stateStyle.__customProperties || noneStyle.__customProperties)
  ) {
    result.__customProperties = mergeCustomProperties(
      noneStyle.__customProperties,
      stateStyle.__customProperties
    );
  } else if (stateStyle.__customProperties) {
    result.__customProperties = stateStyle.__customProperties;
  }

  return result;
};
