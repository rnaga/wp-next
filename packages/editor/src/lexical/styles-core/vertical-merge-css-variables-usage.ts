import type * as types from "../../types";
import { styleExists } from "./style-exists";
import {
  cssVariableUsageKeyType,
  getCSSVariablesUsageObjectKey,
} from "../nodes/css-variables/CSSVariablesNode";

/**
 * Merge __cssVariablesUsage from base into downstream.
 * Only copies keys from base that don't exist in downstream's styles,
 * and marks them as inherited.
 */
export const verticalMergeCSSVariablesUsage = (
  base: Readonly<types.CSSKeyValue>,
  downstream: Readonly<types.CSSKeyValue>
): types.CSSVariablesUsageMixed | undefined => {
  const baseUsage = base?.__cssVariablesUsage as
    | types.CSSVariablesUsageMixed
    | undefined;
  const downstreamUsage = downstream?.__cssVariablesUsage as
    | types.CSSVariablesUsageMixed
    | undefined;

  if (!baseUsage && !downstreamUsage) {
    return undefined;
  }

  const result: types.CSSVariablesUsageMixed = { ...downstreamUsage };

  if (baseUsage) {
    for (const key of Object.keys(baseUsage)) {
      // Check for object value. e.g. tranform-rotate
      const objectKey = getCSSVariablesUsageObjectKey(key);

      // These object keys has prefix of "%" - i.e. need to check key with %. e.g. %tranform: {...}
      if (objectKey && styleExists(downstream, `%${objectKey}`)) {
        // If downstream already has this CSS property, skip
        continue;
      }

      // If downstream already has this CSS property, skip
      if (styleExists(downstream, key as keyof types.CSSKeyValue)) {
        continue;
      }

      // Also if downstream __cssVariablesUsage already has this key, skip
      if (downstreamUsage && key in downstreamUsage) {
        continue;
      }

      // Copy from base with inherit = true
      const baseValue = baseUsage[key];
      if (
        cssVariableUsageKeyType(key) === "array" &&
        Array.isArray(baseValue)
      ) {
        result[key] = baseValue.map((item) => ({
          ...item,
          inherit: true,
        }));
      } else {
        // Throw is baseValue is Array here
        if (Array.isArray(baseValue)) {
          throw new Error(
            "Expected baseValue to be non-array for object type CSS variable usage"
          );
        }

        result[key] = {
          ...baseValue,
          inherit: true,
        };
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};
