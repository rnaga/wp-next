import type * as types from "../../types";
import { isSpecialStyleKey } from "./is-special-style-key";
import { isStyleObject } from "./is-style-object";
import { styleValue } from "./style-value";

export const styleToStringObject = (
  style: types.CSSKeyValue
): types.StyleStringObject => {
  let stringObject: types.StyleStringObjectWithUndefined = {};

  const objectEntries = Object.entries(style) as [types.CSSKey, any][];

  for (const [key, value] of objectEntries) {
    if (isSpecialStyleKey(key)) {
      // Skip special keys
      continue;
    }

    // There are other keys to skip in this loop
    // $key or __key with array value (e.g. __textShadow: [...])
    if (key.startsWith("$") || (key.startsWith("__") && Array.isArray(value))) {
      continue;
    }

    // Check for nested style objects
    if (key.startsWith("__")) {
      if (isStyleObject(value)) {
        const nestedStringObject = styleToStringObject(
          value as types.CSSKeyValue
        );

        stringObject = {
          ...stringObject,
          ...nestedStringObject,
        };
      } else {
        stringObject[key] = styleValue(key, undefined, value);
      }
      continue;
    }

    // For % key e.g. %transform: { skewX: '2deg', rotate: '10deg' } => transform: 'skewX(2deg) rotate(10deg)'
    // we need to convert the object to string
    if (key.startsWith("%")) {
      if (!isStyleObject(value)) {
        throw new Error(
          `Expected style object for key ${key}, but got ${typeof value}`
        );
      }
      // Remove the % prefix
      const actualKey = key.slice(1) as keyof types.CSSKeyValue;
      stringObject[actualKey] = value as types.StyleObjectValue;
      continue;
    }

    stringObject[key] = styleValue(key, stringObject[key], value);
  }

  return stringObject as types.StyleStringObject;
};
