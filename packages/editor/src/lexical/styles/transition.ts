import type * as types from "../../types";

export const transitionValuesToCSSArray = (
  values: (types.CSSTransitionValue | undefined)[]
): string[] | undefined => {
  const convertToCSSValue = (val: types.CSSTransitionValue): string => {
    // Convert the transition value to CSS format
    // e.g., "all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)"
    const property = val.$type || "all";
    const duration = `${val.$duration}ms`;
    const [x1, y1, x2, y2] = val.$cubicBezier;
    const timingFunction = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    return `${property} ${duration} ${timingFunction}`;
  };

  return !values || values.length === 0
    ? undefined
    : values.filter((v) => !!v).map(convertToCSSValue);
};
