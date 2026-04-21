import { CSSProperties } from "react";

export type ResizeDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "rotate"
  | "corner";

export type ToolBoxMouseHandler = (
  e: MouseEvent,
  args: {
    direction: ResizeDirection;
    previewElement: HTMLElement;
  }
) => void | {
  delegate: boolean;
};
