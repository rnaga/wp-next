import { WPLexicalNode } from "../nodes/wp";
import { setStyle } from "./set-style";
import type * as types from "../../types";
import { getStyle } from "./get-style";

export const setAndGetStyle = (
  css: WPLexicalNode["__css"],
  incoming: types.CSSKeyValue,
  resultKey: keyof types.CSSKeyValue,
  options?: {
    device?: types.BreakpointDevice;
    state?: types.CSSState;
  }
) => {
  setStyle(css, incoming, options);

  const style = getStyle(css, {
    device: options?.device,
    state: options?.state,
  }) as types.CSSKeyValue;

  return style?.[resultKey];
};
