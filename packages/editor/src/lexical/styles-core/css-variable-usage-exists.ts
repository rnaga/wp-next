import type * as types from "../../types";
import { getCSSVariablesUsageObjectKey } from "../nodes/css-variables/CSSVariablesNode";

// TODO: handle logic for "%..." key for object values, like %transform-rotate
export const cssVariableUsageExists = (
  style: types.CSSKeyValue | undefined | null,
  targetKey: string
): boolean => {
  if (style === undefined || style === null) {
    return false;
  }

  // Check if targetKey exists in __cssVariablesUsage
  if (style.__cssVariablesUsage && targetKey in style.__cssVariablesUsage) {
    return true;
  }

  return false;
};
