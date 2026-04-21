import type * as types from "../../types";

export const getUnmergedStyle = (
  styles: types.CSSRecord,
  stateStyles: types.CSSStatesRecord,
  device: types.BreakpointDevice,
  state: types.CSSState
): types.CSSKeyValue => {
  if (state === "none") {
    return styles[device] ?? {};
  }

  return stateStyles[state]?.[device] ?? {};
};
