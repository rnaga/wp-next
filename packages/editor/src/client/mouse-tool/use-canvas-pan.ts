import { useEffect, useRef } from "react";

import { useWP } from "@rnaga/wp-next-core/client/wp";

import { trackEventEnd } from "../event-utils";
import { usePreviewLayer } from "../preview-layer";
import { TEMPLATE_ID_UPDATED } from "../template/commands";
import {
  CANVAS_SPACE_PAN_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_MOVE_COMMAND,
  CANVAS_WHEEL_PAN_END_COMMAND,
  CANVAS_WHEEL_PAN_START_COMMAND,
  CANVAS_ZOOMING_COMMAND,
} from "./commands";

/**
 * Wires up all canvas pan interactions for the `#canvas-area` element:
 *   - Wheel-based panning (bubble phase, grey canvas margin)
 *   - Ctrl+wheel zoom interception (capture phase)
 *   - Space + left-button drag pan (Figma/Framer style)
 *   - Fullscreen offset save/restore
 *   - Template change pan reset
 *   - Wheel mode toggle handling
 *
 * All DOM style mutations (left, top, overflow, cursor) are imperative to avoid
 * generating a new Emotion CSS class on every pan tick.
 *
 * @param canvasAreaRef - ref to the outer `#canvas-area` div (cursor changes, event listeners)
 */
export const useCanvasPan = (
  canvasAreaRef: React.RefObject<HTMLDivElement | null>
) => {
  // preview-layer-container ref (left/top/overflow pan writes)
  const { mainAreaRef, previewMode } = usePreviewLayer();
  const { wpHooks } = useWP();

  const wheelModeRef = useRef(true);
  // Mirrors previewMode into a ref so native event handlers can read the current
  // value without a stale closure (their useEffects omit previewMode from deps).
  const previewModeRef = useRef(previewMode);
  const isPanningFromMainArea = useRef(false);

  // Preserves the pan offset so it can be restored when leaving fullscreen.
  const panOffsetBeforeFullscreenRef = useRef({ left: "", top: "" });

  // Space-key + mouse-drag panning: mirrors Figma/Framer behaviour where holding
  // Space and dragging with the left button pans the canvas regardless of whether
  // the wheel pan-mode toggle is on.
  const spaceKeyHeldRef = useRef(false);
  const isMousePanningRef = useRef(false);

  // Tracks the last pointer position so we can compute per-move deltas.
  const mousePanLastPosRef = useRef({ x: 0, y: 0 });

  // Set to true the first time the pointer moves after a Space+mousedown so we
  // can suppress the residual click event that browsers fire on mouseup.
  const mousePanOccurredRef = useRef(false);

  useEffect(() => {
    previewModeRef.current = previewMode;
  }, [previewMode]);

  // When entering fullscreen mode the regular PreviewLayer iframe is hidden
  // but preview-layer-container is still in the DOM. A stale pan offset
  // (e.g. top: -600px) would misplace the fullscreen iframe, so we clear it.
  // Save the values first so we can restore them when the user switches back
  // to edit/preview — that way the pan position is preserved across the round-trip.
  useEffect(() => {
    const el = mainAreaRef.current;
    if (!el) {
      return;
    }

    if (previewMode === "fullscreen") {
      panOffsetBeforeFullscreenRef.current = {
        left: el.style.left,
        top: el.style.top,
      };
      el.style.left = "";
      el.style.top = "";
    } else {
      el.style.left = panOffsetBeforeFullscreenRef.current.left;
      el.style.top = panOffsetBeforeFullscreenRef.current.top;
    }
  }, [previewMode]);

  // Reset pan offset when the active template changes so the new template
  // always starts at position (0, 0) instead of inheriting the previous pan.
  useEffect(() => {
    return wpHooks.action.addCommand(TEMPLATE_ID_UPDATED, () => {
      const el = mainAreaRef.current;
      if (el) {
        el.style.left = "";
        el.style.top = "";
      }
    });
  }, []);

  // Mirror wheel mode enabled state into a ref so the native wheel handler
  // (below) can read it without a stale closure. Clear the preview-layer-container's
  // inline left/top when mode is disabled so it snaps back to (0, 0), and update
  // overflow: auto to restore normal scrolling.
  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_CHANGED_COMMAND,
      ({ enabled }) => {
        wheelModeRef.current = enabled;

        const el = mainAreaRef.current;
        if (!enabled) {
          if (el) {
            el.style.left = "";
            el.style.top = "";
            // Restore normal scrolling when pan mode is off.
            el.style.overflow = "auto";
          }

          // If Space was held while pan mode was toggled off, cancel the
          // space-pan state so the badge and cursor clear immediately.
          if (spaceKeyHeldRef.current) {
            spaceKeyHeldRef.current = false;
            isMousePanningRef.current = false;
            wpHooks.action.doCommand(CANVAS_SPACE_PAN_CHANGED_COMMAND, {
              active: false,
            });
            const mainEl = canvasAreaRef.current;
            if (mainEl) {
              mainEl.style.cursor = "";
            }
          }
        } else {
          if (el) {
            // In wheel mode overflow must be visible so the full-height iframe
            // is not clipped; panning via left/top reveals off-screen content.
            el.style.overflow = "visible";
          }
        }
      }
    );
  }, [wpHooks]);

  // Move preview-layer-container via direct DOM style writes instead of React
  // state to avoid Emotion generating a new CSS class on every wheel tick.
  // CANVAS_WHEEL_MODE_MOVE_COMMAND is the single channel for all pan input —
  // both this handler and use-toolbox-overlay's handler fire from the same
  // command, keeping preview-layer-container and canvas-box in sync.
  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_MOVE_COMMAND,
      ({ delta }) => {
        const el = mainAreaRef.current;
        if (!el) {
          return;
        }

        const currentLeft = parseFloat(el.style.left || "0");
        const currentTop = parseFloat(el.style.top || "0");
        el.style.left = `${currentLeft - delta.x}px`;
        el.style.top = `${currentTop - delta.y}px`;
      }
    );
  }, [wpHooks]);

  // Capture-phase zoom handler: intercepts ctrl+wheel before any child listener
  // (e.g. scroll-handlers.ts's stopPropagation on mouse-event-box) can swallow
  // the event. Capture fires top-down, so this runs before bubbling begins.
  // stopPropagation prevents children from also seeing the event so
  // CANVAS_ZOOMING_COMMAND fires exactly once. preventDefault blocks the
  // browser's native window-level zoom.
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) {
      return;
    }

    const zoomHandler = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.deltaZ !== 0)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaZ > 0 ? "in" : "out";
      wpHooks.action.doCommand(CANVAS_ZOOMING_COMMAND, { event, direction });
    };

    el.addEventListener("wheel", zoomHandler, {
      passive: false,
      capture: true,
    });
    return () =>
      el.removeEventListener("wheel", zoomHandler, { capture: true });
  }, [wpHooks]);

  // Bubble-phase pan handler: covers the grey area surrounding the iframe.
  // Events over the iframe go through mouse-event-box (scroll-handlers.ts);
  // this handler covers areas where mouse-event-box's stopPropagation doesn't
  // apply (grey canvas margin). Ctrl+wheel is already handled by the capture
  // listener above and never reaches here.
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) {
      return;
    }

    const handler = (event: WheelEvent) => {
      if (!wheelModeRef.current || previewModeRef.current === "fullscreen") {
        return;
      }

      event.preventDefault();
      wpHooks.action.doCommand(CANVAS_WHEEL_MODE_MOVE_COMMAND, {
        event,
        delta: { x: event.deltaX, y: event.deltaY },
      });

      if (!isPanningFromMainArea.current) {
        isPanningFromMainArea.current = true;
        wpHooks.action.doCommand(CANVAS_WHEEL_PAN_START_COMMAND, { event });
      }

      trackEventEnd("MAIN_AREA_WHEEL_PAN_END", () => {
        isPanningFromMainArea.current = false;
        wpHooks.action.doCommand(CANVAS_WHEEL_PAN_END_COMMAND, { event });
      });
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [wpHooks]);

  // Track Space key state so mouse-drag pan knows when to activate.
  // Guard against text inputs so typing a space in a settings field still works.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || spaceKeyHeldRef.current) {
        return;
      }

      const active = document.activeElement;
      const isTextInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (isTextInput) {
        return;
      }

      // Space pan is only available when the wheel pan-mode toggle is on.
      if (!wheelModeRef.current) {
        return;
      }

      event.preventDefault();
      spaceKeyHeldRef.current = true;
      wpHooks.action.doCommand(CANVAS_SPACE_PAN_CHANGED_COMMAND, {
        active: true,
      });

      // Blur whatever element has focus (typically the AdjustIcon button after
      // the user enabled pan mode). Without this, mousedown's preventDefault()
      // keeps focus on the button throughout the drag, and the browser then
      // synthesizes a click on it when Space is released — toggling pan mode off.
      (document.activeElement as HTMLElement | null)?.blur();

      const mainEl = canvasAreaRef.current;
      if (mainEl) {
        mainEl.style.cursor = "grab";
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      spaceKeyHeldRef.current = false;
      isMousePanningRef.current = false;
      wpHooks.action.doCommand(CANVAS_SPACE_PAN_CHANGED_COMMAND, {
        active: false,
      });

      const mainEl = canvasAreaRef.current;
      if (mainEl) {
        mainEl.style.cursor = "";
      }
    };

    // Reset when the window loses focus (e.g. user Cmd+Tabs away while holding
    // Space) so the grab cursor doesn't get stuck on.
    const onBlur = () => {
      if (!spaceKeyHeldRef.current) {
        return;
      }

      spaceKeyHeldRef.current = false;
      isMousePanningRef.current = false;
      wpHooks.action.doCommand(CANVAS_SPACE_PAN_CHANGED_COMMAND, {
        active: false,
      });

      const mainEl = canvasAreaRef.current;
      if (mainEl) {
        mainEl.style.cursor = "";
      }
    };

    // capture: true so this fires before the event reaches any focused element
    // (e.g. the AdjustIcon button). Without it, browsers synthesize a click on
    // the focused button during the bubble phase — before preventDefault() on
    // window would have a chance to stop it — which toggles pan mode off.
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Space + left-button drag: pan the canvas like Figma/Framer.
  //
  // Uses a capture-phase mousedown on #main-area so it fires before any child
  // listener (including mouse-event-box in canvas-box). stopPropagation prevents
  // node-selection and other mouse-tool logic from running during the drag.
  //
  // Once a drag starts, mousemove/mouseup are tracked on window so fast pointer
  // movement that leaves the element boundaries still produces smooth panning.
  //
  // Reuses CANVAS_WHEEL_MODE_MOVE_COMMAND: both MainArea's preview-layer-container
  // listener and use-toolbox-overlay's canvas-box listener update from this
  // single command, keeping the two elements in sync automatically.
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      if (!spaceKeyHeldRef.current || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      isMousePanningRef.current = true;
      mousePanOccurredRef.current = false;
      mousePanLastPosRef.current = { x: event.clientX, y: event.clientY };
      el.style.cursor = "grabbing";

      const onWindowMouseMove = (moveEvent: MouseEvent) => {
        if (!isMousePanningRef.current) {
          return;
        }

        const dx = moveEvent.clientX - mousePanLastPosRef.current.x;
        const dy = moveEvent.clientY - mousePanLastPosRef.current.y;
        mousePanLastPosRef.current = {
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        };

        // Negate the mouse delta: dragging right (+dx) should move the
        // preview-layer-container right, which requires delta.x to be negative
        // because the MOVE command handler does `left = currentLeft - delta.x`.
        wpHooks.action.doCommand(CANVAS_WHEEL_MODE_MOVE_COMMAND, {
          event: moveEvent as unknown as WheelEvent,
          delta: { x: -dx, y: -dy },
        });

        mousePanOccurredRef.current = true;
      };

      const onWindowMouseUp = () => {
        isMousePanningRef.current = false;
        window.removeEventListener("mousemove", onWindowMouseMove);
        window.removeEventListener("mouseup", onWindowMouseUp);
        el.style.cursor = spaceKeyHeldRef.current ? "grab" : "";
      };

      window.addEventListener("mousemove", onWindowMouseMove);
      window.addEventListener("mouseup", onWindowMouseUp);
    };

    // Suppress the browser's synthetic click that fires after mouseup when
    // the pointer didn't move far enough to convince it there was no click.
    // We only suppress if actual panning occurred so single Space+click still
    // works correctly for any future use.
    const onClickCapture = (event: MouseEvent) => {
      if (mousePanOccurredRef.current) {
        event.stopPropagation();
        event.preventDefault();
        mousePanOccurredRef.current = false;
      }
    };

    el.addEventListener("mousedown", onMouseDown, { capture: true });
    el.addEventListener("click", onClickCapture, { capture: true });

    return () => {
      el.removeEventListener("mousedown", onMouseDown, { capture: true });
      el.removeEventListener("click", onClickCapture, { capture: true });
    };
  }, [wpHooks]);
};
