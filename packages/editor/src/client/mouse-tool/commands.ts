import { createCommand, NodeKey } from "lexical";
import {
  createActionCommand,
  createFilterCommand,
} from "@rnaga/wp-node/common/hooks-command";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { CSSProperties } from "react";
import type * as types from "../../types";

export const TOOLBOX_CREATED_COMMAND = createActionCommand<{
  node: WPLexicalNode;
  toolBoxRef: React.RefObject<HTMLDivElement | null>;
}>();

export const TOOLBOX_DESTROYED_COMMAND = createActionCommand<{}>();

export const TOOLBOX_START_RESIZE_COMMAND = createActionCommand<undefined>();

export const TOOLBOX_END_RESIZE_COMMAND = createActionCommand<undefined>();

export const TOOLBOX_STYLE_UPDATED_COMMAND = createActionCommand<{
  node: WPLexicalNode;
  toolBoxRef: React.RefObject<HTMLDivElement | null>;
}>();

export const MOUSETOOL_CANVAS_BOX_LOADED = createActionCommand<{
  canvasBoxRef: React.RefObject<HTMLDivElement | null>;
}>();

export const TOOLBOX_RESIZE_HANDLER = createFilterCommand<
  (
    node: WPLexicalNode,
    targetElement: HTMLElement,
    diff: {
      x: number;
      y: number;
    }
  ) => CSSProperties | undefined,
  {
    direction: types.ResizeDirection;
    targetElement: HTMLElement;
    node: WPLexicalNode;
  }
>();

export const TOOLBOX_RESIZE_DIRECTIONS = createFilterCommand<
  { enabled: types.ResizeDirection[]; disabled: types.ResizeDirection[] },
  { node: WPLexicalNode }
>();

export const CANVAS_SCROLL_COMMAND = createActionCommand<{
  event: WheelEvent;
  scroll: {
    direction: "up" | "down" | "left" | "right";
    delta: {
      x: number;
      y: number;
    };
  };
}>();

export const CANVAS_SCROLL_START_COMMAND = createActionCommand<{
  event: WheelEvent;
}>();

export const CANVAS_SCROLL_END_COMMAND = createActionCommand<{
  event: WheelEvent;
}>();

export const WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND = createActionCommand<{
  event?: WheelEvent;
}>();

export const WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND =
  createActionCommand<{
    event?: WheelEvent;
  }>();

export const CANVAS_ZOOMING_COMMAND = createActionCommand<{
  event: WheelEvent;
  direction: "in" | "out";
}>();

// Fired by layout/Toolbar's pan-tool button (outside MouseToolContext).
// MouseToolContext listens and calls toggleWheelMode(), which updates internal
// state and broadcasts CANVAS_WHEEL_MODE_CHANGED_COMMAND to all subscribers.
export const CANVAS_WHEEL_MODE_TOGGLE_COMMAND = createActionCommand<{}>();

// Fired at the start of a wheel-pan gesture (first wheel event after idle).
// use-toolbox-overlay listens to hide the toolbox overlay during rapid movement.
export const CANVAS_WHEEL_PAN_START_COMMAND = createActionCommand<{
  event: WheelEvent;
}>();

// Fired after the wheel stops (debounced via trackEventEnd).
// use-toolbox-overlay listens to reposition and restore the toolbox overlay.
export const CANVAS_WHEEL_PAN_END_COMMAND = createActionCommand<{
  event: WheelEvent;
}>();

// Fired by MouseToolContext.toggleWheelMode() whenever wheel mode is toggled.
// Subscribers: layout/Toolbar (updates button highlight), MainArea (resets
// panOffset state / mirrors enabled into a ref), use-toolbox-overlay (resets
// panOffsetRef and repositions canvas-box).
export const CANVAS_WHEEL_MODE_CHANGED_COMMAND = createActionCommand<{
  enabled: boolean;
}>();

// Fired on every wheel event while wheel mode is active, from three sites:
//   1. scroll-handlers.ts  – wheel over the iframe / mouse-event-box
//   2. MainArea.tsx         – wheel over the grey area outside the iframe
// Subscribers:
//   - MainArea: accumulates delta into panOffset React state → moves preview-layer-container
//   - use-toolbox-overlay: accumulates delta into panOffsetRef → moves canvas-box
// Using one command for all pan input keeps both elements in sync automatically.
export const CANVAS_WHEEL_MODE_MOVE_COMMAND = createActionCommand<{
  event: WheelEvent;
  delta: { x: number; y: number };
}>();

// Fired by MainArea when the Space key is pressed/released to signal that
// mouse-drag (Space + left-click) pan mode is available.
// Subscribers: Toolbar (renders a pan indicator next to the toolbar).
export const CANVAS_SPACE_PAN_CHANGED_COMMAND = createActionCommand<{
  active: boolean;
}>();
