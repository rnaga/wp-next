import { createCommand, LexicalNode } from "lexical";
import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

import { WPLexicalNode } from "../../lexical/nodes/wp";
import type { DragDropPosition } from "../drag-drop/types";
import {
  NodeEventHandlerParameters,
  NodeMutationEventHandlerParameters,
} from "./types";

export const NODE_PROPERTY_UPDATED = createCommand<{
  type?: "input" | "mouse";
  node: WPLexicalNode;
}>();

export const NODE_CLICKED_COMMAND = createCommand<NodeEventHandlerParameters>();

export const NODE_DESTROYED_COMMAND =
  createCommand<NodeMutationEventHandlerParameters>();

export const NODE_CREATED_COMMAND =
  createCommand<NodeMutationEventHandlerParameters>();

export const NODE_UPDATED_COMMAND =
  createCommand<NodeMutationEventHandlerParameters>();

export const NODE_DRAG_START_COMMAND =
  createCommand<NodeEventHandlerParameters>();

export const NODE_DRAG_OVER_COMMAND = createCommand<
  | NodeEventHandlerParameters & {
      targetNode: LexicalNode;
      targetElement: HTMLElement;
      position: DragDropPosition;
    }
>();

export const NODE_DRAG_OUT_COMMAND = createCommand<undefined>();

// Should be triggered only once when the drag is started.
export const NODE_DRAG_END_COMMAND = createCommand<undefined>();

export const NODE_POST_DRAG_END_COMMAND = createActionCommand<undefined>();
