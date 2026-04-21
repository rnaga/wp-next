import type * as types from "../../types";
import { mergeCustomProperties } from "../styles/custom-properties";
import { cloneStyle } from "./clone-style";
import { isSpecialStyleKey } from "./is-special-style-key";
import { isStyleObject } from "./is-style-object";
import { resolveCSSVariableUsage } from "./resolve-css-variable-usage";
import { verticalMergeCSSVariablesUsage } from "./vertical-merge-css-variables-usage";

// Merge styles from base and downstream (downstream device styles)
// e.g. base: desktop styles, downstream: tablet styles
export const verticalMerge = (
  base: Readonly<types.CSSKeyValue>,
  downstream: Readonly<types.CSSKeyValue>,
  options?: {
    shouldMergeCustomProperties?: boolean;
  }
): types.CSSKeyValue => {
  const result = cloneStyle(base) as types.CSSKeyValue;
  const downstreamClone = cloneStyle(downstream) as types.CSSKeyValue;

  const shouldMergeCustomProperties =
    options?.shouldMergeCustomProperties ?? false;

  // Animation CSS doesn't inherit, so we need to remove it before merging
  delete result?.__animation;

  // __cssVariablesUsage is also merged separately
  delete result?.__cssVariablesUsage;

  for (const _object of Object.entries(downstreamClone)) {
    const [key, value] = _object as [keyof types.CSSKeyValue, unknown];

    // Skip special keys - they are handled separately
    if (isSpecialStyleKey(key)) {
      continue;
    }

    if (key.startsWith("__") && isStyleObject(value)) {
      // Merge nested objects
      const baseValue = result[key] || {};
      result[key] = verticalMerge(
        baseValue as types.CSSKeyValue,
        value as types.CSSKeyValue
      );
    } else {
      // Directly assign (downstream takes precedence)
      result[key] = value;
    }
  }

  // Merge __cssVariablesUsage
  const mergedUsage = verticalMergeCSSVariablesUsage(base, downstream);
  if (mergedUsage) {
    result.__cssVariablesUsage = mergedUsage;
  }

  // Merge __customProperties
  if (
    shouldMergeCustomProperties &&
    (base.__customProperties || downstream.__customProperties)
  ) {
    result.__customProperties = mergeCustomProperties(
      base.__customProperties,
      downstream.__customProperties
    );
  } else if (downstream.__customProperties) {
    result.__customProperties = downstream.__customProperties;
  }

  // Merge __animation from downstream (does not inherit)
  if (downstream?.__animation) {
    result.__animation = downstream.__animation;
  }

  // Resolve CSS variable usage against the merged result
  return resolveCSSVariableUsage(result);
};
