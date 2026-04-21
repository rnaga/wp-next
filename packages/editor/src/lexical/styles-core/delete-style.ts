import type * as types from "../../types";
import { isStyleObject } from "./is-style-object";

/**
 * Recursively deletes specified keys from a CSSKeyValue style object.
 * Since CSSKeyValue can have nested objects (e.g. __cssVariablesUsage, %transform),
 * this function traverses the entire object tree to remove matching keys.
 *
 * @param style - The CSSKeyValue object to delete keys from (mutated in place)
 * @param keys - Array of keys to delete from the style object
 */
export const deleteStyle = (
  style: types.CSSKeyValue,
  keys: Array<keyof types.CSSKeyValue>
): void => {
  for (const key of keys) {
    if (key in style) {
      delete style[key];
    }
  }

  // Recursively delete from nested objects
  for (const key of Object.keys(style) as Array<keyof types.CSSKeyValue>) {
    const value = style[key];
    if (isStyleObject(value)) {
      deleteStyle(value as types.CSSKeyValue, keys);
    }
  }
};
