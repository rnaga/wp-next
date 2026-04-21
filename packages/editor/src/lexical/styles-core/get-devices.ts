import { BREAKPOINTS } from "./constants";
import type * as types from "../../types";
export const getDevices = () => {
  const devices = Object.entries(BREAKPOINTS).map(([device]) => device);
  return devices as types.BreakpointDevice[];
};
