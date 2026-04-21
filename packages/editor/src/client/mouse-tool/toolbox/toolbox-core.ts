import { RefObject } from "react";
import { $getNodeByKey, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";
import { parsePx, setStyles } from "../dom";
import { createMouseToolElement } from "../dom/element";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { MouseToolState } from "../MouseToolContext";
import {
  TOOLBOX_END_RESIZE_COMMAND,
  TOOLBOX_RESIZE_HANDLER,
  TOOLBOX_START_RESIZE_COMMAND,
} from "../commands";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { $updateCSS } from "../../../lexical/styles-core/css";
import { trackEventEnd } from "../../event-utils";
import {
  $updateTransformCSS,
  transformValueToRotateAngle,
} from "../../../lexical/styles/transform";
import type * as types from "../../../types";

// ============================================================================
// TYPES
// ============================================================================

type WPHooks = ReturnType<typeof useWP>["wpHooks"];

type EdgeDirection = Extract<
  types.ResizeDirection,
  "top" | "right" | "bottom" | "left"
>;

const ALL_EDGES: EdgeDirection[] = ["top", "right", "bottom", "left"];

type HandleOffsets = Partial<
  Record<"left" | "top" | "right" | "bottom" | "transform", string>
>;

// ============================================================================
// CONSTANTS - Visual Styling
// ============================================================================

export const OVERLAY_ID = "lexical-selected-node";
const BORDER_COLOR = "blue";
const BORDER_STYLE = `2px dotted ${BORDER_COLOR}`;

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = 4.5;
const CORNER_HANDLE_SIZE = 8;
const ROTATE_HANDLE_OFFSET = 24;

const EDGE_THICKNESS = 24;
const EDGE_OFFSET = EDGE_THICKNESS / 2;

const OVERLAY_Z_INDEX = 10;
const HANDLE_Z_INDEX = 1;
const EDGE_Z_INDEX = 2;
const CORNER_Z_INDEX = 3;

// ============================================================================
// OVERLAY INITIALIZATION
// ============================================================================

export const applyBaseOverlayStyles = (overlay: HTMLDivElement) => {
  overlay.id = OVERLAY_ID;
  setStyles(overlay, {
    position: "absolute",
    pointerEvents: "auto",
    zIndex: String(OVERLAY_Z_INDEX),
  });
};

// ============================================================================
// UI ELEMENT CREATION - Handles
// ============================================================================

const createHandle = (
  overlay: HTMLDivElement,
  direction: types.ResizeDirection,
  offsets: HandleOffsets
) => {
  overlay.querySelector(`.resize-handle-${direction}`)?.remove();

  createMouseToolElement("div", {
    className: `resize-handle-${direction}`,
    styles: {
      position: "absolute",
      width: `${HANDLE_SIZE}px`,
      height: `${HANDLE_SIZE}px`,
      borderRadius: "50%",
      border: `1px solid ${BORDER_COLOR}`,
      backgroundColor: "white",
      boxSizing: "border-box",
      zIndex: String(HANDLE_Z_INDEX),
      overflow: "visible",
      pointerEvents: "auto",
      ...offsets,
    },
    appendTo: overlay,
  });
};

const removeHandle = (
  overlay: HTMLDivElement,
  direction: types.ResizeDirection
) => {
  overlay.querySelector(`.resize-handle-${direction}`)?.remove();
};

// ============================================================================
// UI ELEMENT CREATION - Edges
// ============================================================================

const createEdge = (
  overlay: HTMLDivElement,
  direction: EdgeDirection,
  onStart: (direction: types.ResizeDirection, event: MouseEvent) => void
) => {
  overlay.querySelector(`.resize-edge-${direction}`)?.remove();

  const commonStyles = {
    position: "absolute",
    background: "transparent",
    pointerEvents: "auto",
    zIndex: String(EDGE_Z_INDEX),
  } as const;

  const edgeStyles: Record<
    EdgeDirection,
    Partial<Record<keyof CSSStyleDeclaration, string>>
  > = {
    top: {
      ...commonStyles,
      top: `-${EDGE_OFFSET}px`,
      left: "0",
      width: "100%",
      height: `${EDGE_THICKNESS}px`,
      cursor: "ns-resize",
    },
    right: {
      ...commonStyles,
      top: "0",
      right: `-${EDGE_OFFSET}px`,
      width: `${EDGE_THICKNESS}px`,
      height: "100%",
      cursor: "ew-resize",
    },
    bottom: {
      ...commonStyles,
      bottom: `-${EDGE_OFFSET}px`,
      left: "0",
      width: "100%",
      height: `${EDGE_THICKNESS}px`,
      cursor: "ns-resize",
    },
    left: {
      ...commonStyles,
      top: "0",
      left: `-${EDGE_OFFSET}px`,
      width: `${EDGE_THICKNESS}px`,
      height: "100%",
      cursor: "ew-resize",
    },
  };

  createMouseToolElement("div", {
    className: `resize-edge-${direction}`,
    attrs: { "data-edge": direction },
    styles: { ...edgeStyles[direction] },
    on: { mousedown: (event: MouseEvent) => onStart(direction, event) },
    appendTo: overlay,
  });
};

const removeEdge = (overlay: HTMLDivElement, direction: EdgeDirection) => {
  overlay.querySelector(`.resize-edge-${direction}`)?.remove();
};

// ============================================================================
// UI ELEMENT CREATION - Corner Controls
// ============================================================================

const createCornerControls = (
  overlay: HTMLDivElement,
  onStart: (direction: types.ResizeDirection, event: MouseEvent) => void
) => {
  overlay.querySelector(`.resize-corner`)?.remove();
  overlay.querySelector(`.resize-rotate-handle`)?.remove();

  createMouseToolElement("div", {
    className: "resize-corner",
    attrs: { "data-corner": "bottom-right" },
    styles: {
      position: "absolute",
      borderRadius: "50%",
      right: `-${HANDLE_OFFSET}px`,
      bottom: `-${HANDLE_OFFSET}px`,
      width: `${CORNER_HANDLE_SIZE}px`,
      height: `${CORNER_HANDLE_SIZE}px`,
      backgroundColor: "white",
      border: `1px solid ${BORDER_COLOR}`,
      boxSizing: "border-box",
      pointerEvents: "auto",
      cursor: "nwse-resize",
      zIndex: String(CORNER_Z_INDEX),
    },
    on: { mousedown: (event: MouseEvent) => onStart("corner", event) },
    appendTo: overlay,
  });

  createMouseToolElement("div", {
    className: "resize-rotate-handle",
    attrs: { "data-handle": "rotate" },
    styles: {
      position: "absolute",
      borderRadius: "50%",
      right: `-${HANDLE_OFFSET + ROTATE_HANDLE_OFFSET}px`,
      bottom: `-${HANDLE_OFFSET + ROTATE_HANDLE_OFFSET}px`,
      width: `${CORNER_HANDLE_SIZE}px`,
      height: `${CORNER_HANDLE_SIZE}px`,
      background: "transparent",
      border: `1px solid ${BORDER_COLOR}`,
      boxSizing: "border-box",
      pointerEvents: "auto",
      cursor: "alias",
      zIndex: String(CORNER_Z_INDEX),
    },
    on: { mousedown: (event: MouseEvent) => onStart("rotate", event) },
    appendTo: overlay,
  });
};

const removeCornerControls = (overlay: HTMLDivElement) => {
  overlay.querySelector(`.resize-corner`)?.remove();
  overlay.querySelector(`.resize-rotate-handle`)?.remove();
};

// ============================================================================
// OVERLAY UI BUILDER
// ============================================================================

export const buildOverlayUI = (
  overlay: HTMLDivElement,
  onStart: (direction: types.ResizeDirection, event: MouseEvent) => void,
  directions?: {
    disabled?: types.ResizeDirection[];
    enabled?: types.ResizeDirection[];
  }
) => {
  overlay.style.border = BORDER_STYLE;

  const defaultDirections: types.ResizeDirection[] = [
    "top",
    "right",
    "bottom",
    "left",
    "corner",
  ];

  const enabledDirections: types.ResizeDirection[] = Array.from(
    new Set<types.ResizeDirection>([
      ...defaultDirections.filter((d) => !directions?.disabled?.includes(d)),
      ...(directions?.enabled ?? []),
    ])
  );

  const enabledSet = new Set<types.ResizeDirection>(enabledDirections);
  const isEdgeEnabled = (direction: EdgeDirection) => enabledSet.has(direction);
  const isCornerEnabled = enabledSet.has("corner");

  const handleDefinitions: Array<{
    direction: types.ResizeDirection;
    enabled: boolean;
    offsets: HandleOffsets;
  }> = [
    {
      direction: "top",
      enabled: isEdgeEnabled("top"),
      offsets: {
        left: "50%",
        top: `-${HANDLE_OFFSET}px`,
        transform: "translateX(-50%)",
      },
    },
    {
      direction: "right",
      enabled: isEdgeEnabled("right"),
      offsets: {
        right: `-${HANDLE_OFFSET}px`,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
    {
      direction: "bottom",
      enabled: isEdgeEnabled("bottom"),
      offsets: {
        left: "50%",
        bottom: `-${HANDLE_OFFSET}px`,
        transform: "translateX(-50%)",
      },
    },
    {
      direction: "left",
      enabled: isEdgeEnabled("left"),
      offsets: {
        left: `-${HANDLE_OFFSET}px`,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
    {
      direction: "corner",
      enabled: isCornerEnabled,
      offsets: { right: `-${HANDLE_OFFSET}px`, bottom: `-${HANDLE_OFFSET}px` },
    },
  ];

  handleDefinitions.forEach(({ direction, enabled, offsets }) => {
    if (enabled) {
      createHandle(overlay, direction, offsets);
    } else {
      removeHandle(overlay, direction);
    }
  });

  ALL_EDGES.forEach((direction) => {
    if (isEdgeEnabled(direction)) {
      createEdge(overlay, direction, onStart);
    } else {
      removeEdge(overlay, direction);
    }
  });

  if (isCornerEnabled) {
    createCornerControls(overlay, onStart);
  } else {
    removeCornerControls(overlay);
  }
};

// ============================================================================
// RESIZE LOGIC - Utilities
// ============================================================================

const calculateAngle = (cx: number, cy: number, px: number, py: number) =>
  (Math.atan2(py - cy, px - cx) * 180) / Math.PI;

const clampNonNegative = (value: number) => Math.max(0, value);

const computeDimensions = (
  direction: types.ResizeDirection,
  startWidth: number,
  startHeight: number,
  deltaX: number,
  deltaY: number
) => {
  switch (direction) {
    case "top":
      return {
        width: startWidth,
        height: clampNonNegative(startHeight - deltaY),
      };
    case "right":
      return {
        width: clampNonNegative(startWidth + deltaX),
        height: startHeight,
      };
    case "bottom":
      return {
        width: startWidth,
        height: clampNonNegative(startHeight + deltaY),
      };
    case "left":
      return {
        width: clampNonNegative(startWidth - deltaX),
        height: startHeight,
      };
    case "corner":
      return {
        width: clampNonNegative(startWidth + deltaX),
        height: clampNonNegative(startHeight + deltaY),
      };
    default:
      return { width: startWidth, height: startHeight };
  }
};

// ============================================================================
// RESIZE LOGIC - Main Function
// ============================================================================

export type StartResizeProps = {
  direction: types.ResizeDirection;
  startEvent: MouseEvent;
  scale: number;
  targetElement: HTMLElement;
  node: WPLexicalNode;
  editor: LexicalEditor;
  wpHooks: WPHooks;
  mouseToolState: RefObject<MouseToolState>;
  setState: (state: "resizing" | "idle") => void;
  getState: () => MouseToolState;
};

export const startResize = (props: StartResizeProps) => {
  const {
    direction,
    startEvent,
    scale,
    targetElement,
    node,
    wpHooks,
    setState,
    getState,
    editor,
  } = props;

  startEvent.preventDefault();
  startEvent.stopPropagation();

  const startX = startEvent.clientX;
  const startY = startEvent.clientY;

  const computed = getComputedStyle(targetElement);
  const startWidth = parsePx(computed.width);
  const startHeight = parsePx(computed.height);

  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const latestNode = editor.read(
    () => $getNodeByKey(node.getKey()) as WPLexicalNode
  );

  const initialStyleTransform = editor.read(
    () => latestNode.__css.get()["%transform"] || {}
  ) as { rotate?: string };

  const initialRotateValue = parseFloat(initialStyleTransform.rotate || "0");

  const rotation = transformValueToRotateAngle(computed.transform);
  const startPointerAngle = calculateAngle(centerX, centerY, startX, startY);

  const previousUserSelect = document.body.style.userSelect;
  document.body.style.userSelect = "none";

  const ensureResizingState = () => {
    if (getState() !== "resizing") {
      wpHooks.action.doCommand(TOOLBOX_START_RESIZE_COMMAND, undefined);
    }
    setState("resizing");
  };

  let isFirstMove = true;

  const handleMouseMove = (event: MouseEvent) => {
    ensureResizingState();

    const deltaX = (event.clientX - startX) / scale;
    const deltaY = (event.clientY - startY) / scale;

    const customHandler = wpHooks.filter.applyCommand(
      TOOLBOX_RESIZE_HANDLER,
      undefined,
      { node: latestNode, targetElement, direction }
    );

    if (customHandler) {
      trackEventEnd(
        "toolbox_resize_custom_handler",
        () => {
          const styles = customHandler(node, targetElement, {
            x: event.movementX,
            y: event.movementY,
          });
          if (styles) {
            editor.update(
              () => {
                $updateCSS({ editor, node: latestNode, styles, type: "mouse" });
              },
              {
                discrete: true,
                ...(isFirstMove ? {} : { tag: HISTORY_MERGE_TAG }),
              }
            );
            isFirstMove = false;
          }
        },
        10,
        { counter: 3 }
      );
      return;
    }

    if (direction === "rotate") {
      const currentRect = targetElement.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      const currentAngle = calculateAngle(
        currentCenterX,
        currentCenterY,
        event.clientX,
        event.clientY
      );
      const angleDelta = (currentAngle - startPointerAngle) / scale;
      const newAngle = rotation + angleDelta;
      const rotationDifference = newAngle - rotation;
      const updatedRotateValue = initialRotateValue + rotationDifference;
      const roundedRotateValue = Math.round(updatedRotateValue * 10000) / 10000;

      editor.update(
        () => {
          $updateTransformCSS({
            editor,
            node: latestNode,
            transform: { rotate: `${roundedRotateValue}deg` },
            type: "mouse",
          });
        },
        {
          discrete: true,
          ...(isFirstMove ? {} : { tag: HISTORY_MERGE_TAG }),
        }
      );
      isFirstMove = false;
      return;
    }

    const { width, height } = computeDimensions(
      direction,
      startWidth,
      startHeight,
      deltaX,
      deltaY
    );

    const roundedWidth = Math.round(width * 100) / 100;
    const roundedHeight = Math.round(height * 100) / 100;

    editor.update(
      () => {
        $updateCSS({
          editor,
          node: latestNode,
          styles: { width: `${roundedWidth}px`, height: `${roundedHeight}px` },
          type: "mouse",
        });
      },
      {
        discrete: true,
        ...(isFirstMove ? {} : { tag: HISTORY_MERGE_TAG }),
      }
    );
    isFirstMove = false;
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = previousUserSelect;

    setTimeout(() => {
      setState("idle");
      wpHooks.action.doCommand(TOOLBOX_END_RESIZE_COMMAND, undefined);
    }, 100);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
