import { LexicalEditor } from "lexical";
import { useNodeEvent } from "../node-event";
import { useGlobalEventContext } from "./GlobalEventContext";
import { useDragDrop } from "../drag-drop";
import { BreakpointRef, useBreakpoint } from "../breakpoint";
import { usePreviewLayer } from "../preview-layer";
import { RefreshFn } from "../refresh/types";
import { WheelEventHandlerParameters } from "../event-utils/add-wheel-event-listener";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { RefObject } from "react";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export type SelectedNodeRef = RefObject<{
  node: WPLexicalNode | undefined;
  latest: () => WPLexicalNode | undefined;
  prevNodeKey: string | undefined;
  focus: boolean;
}>;

export type GlobalEventHandlerParameters = {
  breakpoint: ReturnType<typeof useBreakpoint>;
  previewLayer: ReturnType<typeof usePreviewLayer>;
  dragDrop: ReturnType<typeof useDragDrop>;
  editor: LexicalEditor;
  event: Event;
  globalEvent: ReturnType<typeof useGlobalEventContext>;
  nodeEvent: ReturnType<typeof useNodeEvent>;
  wp: ReturnType<typeof useWP>;
  refresh: RefreshFn;
};

export type GlobalEventHandler = (args: GlobalEventHandlerParameters) => void;

export type GlobalWheelEventHandlerParameters = GlobalEventHandlerParameters & {
  eventArgs: WheelEventHandlerParameters;
};

export type GlobalWheelEventHandler = (
  args: GlobalWheelEventHandlerParameters
) => void;
