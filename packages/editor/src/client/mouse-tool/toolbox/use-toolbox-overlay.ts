import { useCallback, useEffect } from "react";
import { COMMAND_PRIORITY_HIGH, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useBreakpoint } from "../../breakpoint";
import {
  WP_BREAKPOINT_CHANGED_COMMAND,
  WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
} from "../../breakpoint/commands";
import { useSelectedNode } from "../../global-event";
import { setOverlayPosition } from "../dom";
import {
  CANVAS_SCROLL_COMMAND,
  CANVAS_WHEEL_MODE_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_MOVE_COMMAND,
  CANVAS_WHEEL_PAN_END_COMMAND,
  CANVAS_WHEEL_PAN_START_COMMAND,
  CANVAS_ZOOMING_COMMAND,
  TOOLBOX_STYLE_UPDATED_COMMAND,
} from "../commands";
import { TEMPLATE_ID_UPDATED } from "../../template/commands";
import { useMouseTool } from "../MouseToolContext";
import { NODE_PROPERTY_UPDATED } from "../../node-event";
import {
  PREVIEW_LAYER_CONTAINER_SCROLL_COMMAND,
  PREVIEW_LAYER_MODE_UPDATED_COMMAND,
} from "../../preview-layer";
import { trackEventEnd } from "../../event-utils";
import {
  addLexicalCommands,
  addWPHooksActionCommands,
} from "../../event-utils/add-commands";
import { CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND } from "../../right-panel-form/commands";
import { useElementState } from "../../right-panel-form/ElementStateContext";
import { $getTransformCSSType } from "../../../lexical/styles/transform";
import { WPLexicalNode } from "../../../lexical/nodes/wp";

type UseToolboxOverlayDeps = {
  getElementByNodeKey: (key: string) => HTMLElement | null;
  setTransformType: (type: "2d" | "3d") => void;
};

export const useToolboxOverlay = (deps: UseToolboxOverlayDeps) => {
  const { getElementByNodeKey, setTransformType } = deps;

  const [editor] = useLexicalComposerContext();
  const { canvasBoxRef, toolBoxRef, panOffsetRef } = useMouseTool();
  const { breakpointRef, getParentElement } = useBreakpoint();
  const { wpHooks } = useWP();
  const { selectedNode } = useSelectedNode();
  const { elementState } = useElementState();

  const applyOverlayPosition = useCallback(
    (target?: HTMLElement | null) => {
      const overlay = toolBoxRef.current;
      if (!overlay || !target) return false;

      setOverlayPosition(overlay, target, breakpointRef.current.scale, {
        styles: { pointerEvents: "auto" },
      });

      wpHooks.action.doCommand(TOOLBOX_STYLE_UPDATED_COMMAND, {
        node: selectedNode!,
        toolBoxRef,
      });

      return true;
    },
    [breakpointRef, toolBoxRef.current, elementState]
  );

  // Reposition when node CSS properties update
  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (!canvasBoxRef.current || !toolBoxRef.current) return false;

        const targetElement = getElementByNodeKey(node.getKey());
        if (applyOverlayPosition(targetElement)) {
          trackEventEnd("toolbox-reposition", () => {
            applyOverlayPosition(targetElement);
          });
        }

        const transformType = editor.read(() =>
          $getTransformCSSType(node as WPLexicalNode)
        );
        setTransformType(transformType);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [applyOverlayPosition, editor, getElementByNodeKey]);

  // Reposition after undo/redo
  useEffect(() => {
    if (!selectedNode) return;
    return addLexicalCommands(editor, [UNDO_COMMAND, REDO_COMMAND], () => {
      editor.read(() => {
        const targetElement = getElementByNodeKey(selectedNode.getKey());
        setTimeout(() => {
          applyOverlayPosition(targetElement);
        }, 10);
      });
      return false;
    });
  }, [selectedNode]);

  // Reposition on breakpoint or CSS editor state changes
  useEffect(() => {
    const removeCommands: VoidFunction[] = [];
    for (const command of [
      WP_BREAKPOINT_CHANGED_COMMAND,
      CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND,
    ]) {
      removeCommands.push(
        wpHooks.action.addCommand(command, () => {
          if (!canvasBoxRef.current || !toolBoxRef.current || !selectedNode)
            return;
          setTimeout(() => {
            const targetElement = getElementByNodeKey(selectedNode.getKey());
            applyOverlayPosition(targetElement);
          }, 10);
        })
      );
    }
    return () => {
      removeCommands.forEach((remove) => remove());
    };
  }, [selectedNode, elementState]);

  // canvas-box is a sibling of preview-layer-container in the DOM.
  // Both must stay aligned so that overlays inside canvas-box (toolbox, hover border)
  // visually match the iframe content they cover.
  //
  // The correct canvas-box position is:
  //   left = panOffset.x - scrollLeft * scale
  //   top  = panOffset.y - scrollTop  * scale
  //
  // panOffset tracks Figma-style wheel-pan translation applied to both
  // preview-layer-container (via React state in MainArea) and canvas-box (here).
  // scrollLeft/Top is the scroll position of preview-layer-container.
  // Multiplying by scale converts iframe-content pixels to outer-page pixels.
  //
  // WARNING: Do NOT write canvas-box.style.left/top anywhere else — competing
  // writes caused pan offsets to be silently discarded on scale changes.
  const applyCanvasBoxPosition = useCallback(() => {
    const canvasElement = document.getElementById("canvas-box");
    if (!canvasElement) return;
    const parentElement = getParentElement();
    const scrollLeft = parentElement?.scrollLeft ?? 0;
    const scrollTop = parentElement?.scrollTop ?? 0;
    const scale = breakpointRef.current.scale;
    canvasElement.style.left = `${panOffsetRef.current.x - scrollLeft * scale}px`;
    canvasElement.style.top = `${panOffsetRef.current.y - scrollTop * scale}px`;
  }, [breakpointRef, getParentElement]);

  // Recompute on regular scroll and device/breakpoint changes.
  // WP_BREAKPOINT_CHANGED_COMMAND fires synchronously inside setScale, so the
  // canvas-box update races against React committing the new CSS transform on
  // preview-layer-container. That is intentional: the scale factor in
  // breakpointRef is already updated at this point, and the scroll values are
  // still valid. The deferred WP_BREAKPOINT_SCALE_CHANGED_COMMAND handler below
  // does a second pass once the DOM has settled.
  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [
        CANVAS_SCROLL_COMMAND,
        WP_BREAKPOINT_CHANGED_COMMAND,
        PREVIEW_LAYER_CONTAINER_SCROLL_COMMAND,
        PREVIEW_LAYER_MODE_UPDATED_COMMAND,
      ],
      applyCanvasBoxPosition
    );
  }, [applyCanvasBoxPosition, wpHooks]);

  // WP_BREAKPOINT_SCALE_CHANGED_COMMAND fires alongside WP_BREAKPOINT_CHANGED_COMMAND
  // but preview-layer-container's CSS transform (scale) is a React-state-driven
  // Emotion class that commits asynchronously. The setTimeout ensures we read
  // getComputedStyle after the browser has painted the new transform, matching
  // the same pattern used in PreviewLayer.tsx for updateIframOffset.
  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
      () => {
        setTimeout(applyCanvasBoxPosition);
      }
    );
  }, [applyCanvasBoxPosition, wpHooks]);

  // Accumulate pan delta into panOffsetRef (the ref is the authoritative store
  // for canvas-box pan offset; MainArea keeps a parallel React state copy for
  // preview-layer-container positioning). Both are updated from the same command
  // so they always agree. The ref must be mutated before applyCanvasBoxPosition
  // reads it, hence the synchronous write-then-apply pattern here.
  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_MOVE_COMMAND,
      ({ delta }) => {
        panOffsetRef.current.x -= delta.x;
        panOffsetRef.current.y -= delta.y;
        applyCanvasBoxPosition();
      }
    );
  }, [applyCanvasBoxPosition, wpHooks]);

  // When wheel mode is toggled off, reset the accumulated pan offset and
  // re-apply canvas-box position. setTimeout defers until after MainArea's
  // React state reset (setPanOffset({x:0,y:0})) has been committed, so that
  // canvas-box and preview-layer-container return to (0,0) together.
  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_CHANGED_COMMAND,
      ({ enabled }) => {
        if (!enabled) {
          panOffsetRef.current = { x: 0, y: 0 };
          setTimeout(applyCanvasBoxPosition);
        }
      }
    );
  }, [applyCanvasBoxPosition, wpHooks]);

  // When the active template changes, reset the pan offset so canvas-box
  // starts at (0, 0) for the new template — mirrors the reset in MainArea.tsx
  // that clears preview-layer-container's inline left/top.
  useEffect(() => {
    return wpHooks.action.addCommand(TEMPLATE_ID_UPDATED, () => {
      panOffsetRef.current = { x: 0, y: 0 };
      setTimeout(applyCanvasBoxPosition);
    });
  }, [applyCanvasBoxPosition, wpHooks]);

  // Hide the toolbox overlay while panning to avoid it snapping around during
  // rapid movement. On pan end (debounced by trackEventEnd), reposition it
  // against the now-stable canvas-box and make it visible again.
  // The 16 ms delay gives the browser one frame to finalize canvas-box position
  // before getBoundingClientRect is called inside applyOverlayPosition.
  useEffect(() => {
    const removeStart = wpHooks.action.addCommand(
      CANVAS_WHEEL_PAN_START_COMMAND,
      () => {
        if (toolBoxRef.current) {
          toolBoxRef.current.style.visibility = "hidden";
        }
      }
    );

    const removeEnd = wpHooks.action.addCommand(
      CANVAS_WHEEL_PAN_END_COMMAND,
      () => {
        if (!selectedNode || !toolBoxRef.current) return;
        const targetElement = getElementByNodeKey(selectedNode.getKey());
        setTimeout(() => {
          applyOverlayPosition(targetElement);
          if (toolBoxRef.current) {
            toolBoxRef.current.style.visibility = "visible";
          }
        }, 16);
      }
    );

    return () => {
      removeStart();
      removeEnd();
    };
  }, [selectedNode]);

  // Hide the toolbox overlay while zooming (ctrl+wheel) — the CSS transform
  // scale changes on every tick, so the overlay's cached rect becomes stale.
  // On zoom end (debounced), reposition against the settled scale and restore
  // visibility. The 16 ms delay matches the pan-end pattern above.
  useEffect(() => {
    return wpHooks.action.addCommand(CANVAS_ZOOMING_COMMAND, () => {
      if (toolBoxRef.current) {
        toolBoxRef.current.style.visibility = "hidden";
      }

      trackEventEnd("TOOLBOX_ZOOM_END", () => {
        if (!selectedNode || !toolBoxRef.current) return;
        const targetElement = getElementByNodeKey(selectedNode.getKey());
        setTimeout(() => {
          applyOverlayPosition(targetElement);
          if (toolBoxRef.current) {
            toolBoxRef.current.style.visibility = "visible";
          }
        }, 16);
      });
    });
  }, [selectedNode]);

  return { applyOverlayPosition };
};
