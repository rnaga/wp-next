import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import { BreakpointRef } from "./types";

export const WP_BREAKPOINT_CHANGED_COMMAND =
  createActionCommand<BreakpointRef>();

export const WP_BREAKPOINT_DEVICE_CHANGED_COMMAND =
  createActionCommand<BreakpointRef>();

export const WP_BREAKPOINT_SCALE_CHANGED_COMMAND =
  createActionCommand<BreakpointRef>();

export const WP_BREAKPOINT_WIDTH_CHANGED_COMMAND =
  createActionCommand<BreakpointRef>();

export const WP_BREAKPOINT_HEIGHT_CHANGED_COMMAND =
  createActionCommand<BreakpointRef>();
