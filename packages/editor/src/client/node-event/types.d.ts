import { Klass, LexicalEditor, LexicalNode, NodeMutation } from "lexical";

import { usePreviewLayer } from "../preview-layer";
import { RefreshFn } from "../refresh/types";
import { useTemplate } from "../template/use-template";
import { events } from "./node-event-handlers";
import { GlobalEventHandlerParameters } from "../global-event/types";

type EventType = Exclude<(typeof events)[number], `node-${NodeMutation}`>;
type NodeMutationEvents = Exclude<(typeof events)[number], EventType>;

export type NodeType = ReturnType<Klass<LexicalNode>["getType"]>;
export type NodeOrKlass = LexicalNode | Klass<LexicalNode>;

// export type SelectedNode = {
//   current: string | undefined;
//   prev: string | undefined;
// };

export type NodeEventHandlerParameters = {
  previewLayer: ReturnType<typeof usePreviewLayer>;
  element: null | HTMLElement;
  klassNode?: Klass<LexicalNode>;
  nodeKey: string;
  // refresh: RefreshFn;
  //setSelectedNode: (nodeKey?: string) => void;
  template: ReturnType<typeof useTemplate>;
  wpHooks: ReturnType<typeof useWP>["wpHooks"];
} & Omit<GlobalEventHandlerParameters, "nodeEvent">;

export type NodeEventHandler = (args: NodeEventHandlerParameters) => void;

export type NodeMutationEventHandlerParameters = {
  previewLayer: ReturnType<typeof usePreviewLayer>;
  element: null | HTMLElement;
  klassNode?: Klass<LexicalNode>;
  nodeKey: string;
  //setSelectedNode: (nodeKey?: string) => void;
  template: ReturnType<typeof useTemplate>;
  wpHooks: ReturnType<typeof useWP>["wpHooks"];
} & Omit<GlobalEventHandlerParameters, "event" | "nodeEvent">;

export type NodeMutationEventHandler = (
  args: NodeMutationEventHandlerParameters
) => void;

export type NodeEventHandlers = Partial<Record<EventType, NodeEventHandler>> &
  Partial<Record<NodeMutationEvents, NodeMutationEventHandler>>;
