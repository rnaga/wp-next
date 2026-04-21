import type * as types from "../../types";
import {
  CSS_CUSTOM_PROPERTIES_KEY,
  CSS_EXTERNAL_CLASS_NAMES_KEY,
} from "./constants";

import { cloneStyle } from "./clone-style";
import { deleteEmptyValues } from "./delete-empty-values";
import { getUnmergedStyle } from "./get-unmerged-style";
import { isEmptyValue } from "./is-empty-value";
import { isSpecialStyleKey } from "./is-special-style-key";
import { isStyleObject } from "./is-style-object";
import { CSSDevice } from "./css-device";
import type { WPLexicalNode } from "../nodes/wp/types";

const mergeStyleRecursive = (
  target: types.CSSKeyValue,
  incoming: types.CSSKeyValue
): types.CSSKeyValue => {
  for (const key of Object.keys(incoming) as Array<keyof types.CSSKeyValue>) {
    if (isSpecialStyleKey(key)) continue;

    const value = incoming[key];
    const targetValue = target[key];

    if (isEmptyValue(value)) {
      delete target[key];
      continue;
    }

    if (key.startsWith("__") && isStyleObject(value)) {
      target[key] = isStyleObject(targetValue)
        ? mergeStyleRecursive(targetValue, value)
        : cloneStyle(value);
    } else if (key.startsWith("%")) {
      // Handle object values e.g. %transform: { skewX: '2deg' }
      const merged = {
        ...target[key],
        ...value,
      };
      // Remove keys with empty values (undefined, null, "") from merged object
      deleteEmptyValues(merged);
      target[key] = merged;
    } else {
      // For other keys, and value can be string, number, array, etc.
      target[key] = value;
    }
  }

  return target;
};

export const setStyle = (
  css: WPLexicalNode["__css"],
  incoming: types.CSSKeyValue,
  options?: {
    device?: types.BreakpointDevice;
    state?: types.CSSState;
  }
) => {
  const currentDevice = options?.device || CSSDevice.__current;
  const currentState = options?.state || "none";

  const clonedStyle: types.CSSKeyValue = cloneStyle(
    getUnmergedStyle(
      css.__styles,
      css.__stylesStates,
      currentDevice,
      currentState
    ) || {}
  );

  const mergedStyle = mergeStyleRecursive(clonedStyle, incoming);

  // Handle special keys that are skipped by mergeStyleRecursive

  // CSS_EXTERNAL_CLASS_NAMES_KEY is attached to css.__externalClassNames
  const externalClassNames = incoming[CSS_EXTERNAL_CLASS_NAMES_KEY];
  if (externalClassNames !== undefined) {
    css[CSS_EXTERNAL_CLASS_NAMES_KEY] = externalClassNames;
  }

  // __animation
  const animationValue = incoming["__animation"];
  if (animationValue !== undefined) {
    mergedStyle["__animation"] = animationValue;
  }

  // CSS_CUSTOM_PROPERTIES_KEY
  const customPropertiesValue = incoming[CSS_CUSTOM_PROPERTIES_KEY];
  if (customPropertiesValue) {
    mergedStyle[CSS_CUSTOM_PROPERTIES_KEY] = customPropertiesValue;
  }

  // cssVariables usage keys
  const cssVariables = incoming.__cssVariablesUsage;
  if (cssVariables) {
    const merged = {
      ...clonedStyle.__cssVariablesUsage,
      ...cssVariables,
    };
    for (const key of Object.keys(cssVariables)) {
      if (isEmptyValue(cssVariables[key])) {
        delete merged[key];
      }
    }
    mergedStyle.__cssVariablesUsage = merged;
  }

  if (currentState === "none") {
    css.__styles[currentDevice] = mergedStyle;
  } else {
    if (!css.__stylesStates[currentState]) {
      css.__stylesStates[currentState] = {};
    }
    css.__stylesStates[currentState]![currentDevice] = mergedStyle;
  }
};
