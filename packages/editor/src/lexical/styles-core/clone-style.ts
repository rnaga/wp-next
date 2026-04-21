import type * as types from "../../types";

const cloneValue = <T extends Record<string, any> | null | undefined>(
  value: T
): T => {
  if (value === null || value === undefined) {
    // Return empty object for null/undefined to preserve the value
    return undefined as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const cloned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      cloned[key] = cloneValue(value[key]);
    }
    return cloned as T;
  }

  return value;
};

export const cloneStyle = <T extends Record<string, any> | null | undefined>(
  style: T
): T => {
  return cloneValue(style) as T;
};
