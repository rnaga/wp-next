import { isEmptyValue } from "./is-empty-value";
import { isStyleObject } from "./is-style-object";

/**
 * Recursively scans an object and deletes keys with empty values (undefined, null, "").
 * Mutates the object in place.
 *
 * @param obj - The object to scan and clean
 */
export const deleteEmptyValues = (obj: Record<string, unknown>): void => {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (isEmptyValue(value)) {
      delete obj[key];
    } else if (isStyleObject(value)) {
      deleteEmptyValues(value as Record<string, unknown>);
    }
  }
};
