import type * as types from "../../types";

export type BreakpointState = {
  device: types.BreakpointDevice;
  scale: number;
  wrapperWidth: number;
  widthRatio: number;
  heightDVH: number;
};

export type BreakpointRef = React.RefObject<BreakpointState>;
