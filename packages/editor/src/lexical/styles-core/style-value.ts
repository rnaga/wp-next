import type * as types from "../../types";
import { isStyleObject } from "./is-style-object";

export const styleValue = (
  key: keyof types.CSSKeyValue,
  base: unknown,
  value: unknown
): types.StyleStringObjectWithUndefined[string] => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value.length
          ? [...value]
          : [...(base ? (base as string[]) : []), ...value]
      )
    );
  }

  if (isStyleObject(value)) {
    if (base && isStyleObject(base)) {
      return {
        ...base,
        ...value,
      } as unknown as string;
    }

    return value as unknown as string;
  }

  return String(value);
};
