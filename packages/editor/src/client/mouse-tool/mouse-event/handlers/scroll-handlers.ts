import type React from "react";
import type { useWP } from "@rnaga/wp-next-core/client/wp";
import type { useBreakpoint } from "../../../breakpoint";
import {
  CANVAS_SCROLL_COMMAND,
  CANVAS_SCROLL_END_COMMAND,
  CANVAS_SCROLL_START_COMMAND,
  CANVAS_WHEEL_MODE_MOVE_COMMAND,
  CANVAS_WHEEL_PAN_END_COMMAND,
  CANVAS_WHEEL_PAN_START_COMMAND,
  WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND,
  WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND,
} from "../../commands";
import { trackEventEnd } from "../../../event-utils";

type ScrollHandlerDeps = {
  wpHooks: ReturnType<typeof useWP>["wpHooks"];
  breakpointRef: ReturnType<typeof useBreakpoint>["breakpointRef"];
  isScrolling: React.MutableRefObject<boolean>;
  scrollAtTheBottom: React.MutableRefObject<boolean>;
  wheelModeRef: React.RefObject<boolean>;
  isPanningRef: React.MutableRefObject<boolean>;
};

export const createScrollHandlers = (deps: ScrollHandlerDeps) => {
  const {
    wpHooks,
    breakpointRef,
    isScrolling,
    scrollAtTheBottom,
    wheelModeRef,
    isPanningRef,
  } = deps;

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      (event.deltaX === 0 && event.deltaY === 0) ||
      event.deltaX === event.deltaY
    ) {
      return;
    }

    // Wheel mode: translate the entire canvas instead of
    // scrolling content. Fire CANVAS_WHEEL_MODE_MOVE_COMMAND with the raw delta
    // so both MainArea (preview-layer-container) and use-toolbox-overlay
    // (canvas-box) can update their positions from the same value.
    // PAN_START fires once at the beginning of a gesture; PAN_END is debounced
    // via trackEventEnd so it fires only after the wheel stops.
    if (wheelModeRef.current) {
      wpHooks.action.doCommand(CANVAS_WHEEL_MODE_MOVE_COMMAND, {
        event,
        delta: { x: event.deltaX, y: event.deltaY },
      });

      if (!isPanningRef.current) {
        isPanningRef.current = true;
        wpHooks.action.doCommand(CANVAS_WHEEL_PAN_START_COMMAND, { event });
      }

      trackEventEnd("CANVAS_WHEEL_PAN_END", () => {
        isPanningRef.current = false;
        wpHooks.action.doCommand(CANVAS_WHEEL_PAN_END_COMMAND, { event });
      });
      return;
    }

    const scale = breakpointRef.current.scale;
    const deltaX = event.deltaX * scale;
    const deltaY = event.deltaY * scale;

    let scrollDirection: "down" | "up" | "left" | "right";
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      scrollDirection = deltaY > 0 ? "down" : "up";
    } else {
      scrollDirection = deltaX > 0 ? "right" : "left";
    }

    wpHooks.action.doCommand(CANVAS_SCROLL_COMMAND, {
      event,
      scroll: { direction: scrollDirection, delta: { x: deltaX, y: deltaY } },
    });

    if (isScrolling.current === false) {
      wpHooks.action.doCommand(CANVAS_SCROLL_START_COMMAND, { event });
      isScrolling.current = true;
    }
    trackEventEnd("CANVAS_SCROLL_END", () => {
      wpHooks.action.doCommand(CANVAS_SCROLL_END_COMMAND, { event });
      isScrolling.current = false;
    });

    const { scrollTop, scrollHeight, clientHeight } =
      event.target as HTMLIFrameElement;
    if (!scrollTop || !scrollHeight || !clientHeight) return;

    const isAtTheBottom = scrollTop + clientHeight >= scrollHeight - 10;
    if (isAtTheBottom && !scrollAtTheBottom.current) {
      scrollAtTheBottom.current = true;
      wpHooks.action.doCommand(WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND, {
        event,
      });
    }

    if (!isAtTheBottom && scrollAtTheBottom.current) {
      scrollAtTheBottom.current = false;
      wpHooks.action.doCommand(WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND, {
        event,
      });
    }
  };

  return { onWheel };
};
