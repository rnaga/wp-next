import { $getNodeByKey, HISTORY_MERGE_TAG } from "lexical";
import {
  NodeEventHandlers,
  NodeMutationEventHandler,
} from "../../../../client/node-event/types";
import { processWidget, WidgetNode } from "../WidgetNode";
import { eventHandlers } from "../../../../client/node-event";

export const widgetEventHandlers: NodeEventHandlers = {
  ...eventHandlers(),

  click: (args) => {
    const { element, nodeKey, editor } = args;

    editor.update(
      () => {
        const writable = $getNodeByKey<WidgetNode>(nodeKey)?.getWritable();
        if (!writable) return;
        //writable.ID = 241; //160;
        processWidget({
          nodeKey: writable.getKey(),
          editor,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  },
  "node-created": (...args: Parameters<NodeMutationEventHandler>) => {
    const { element } = args[0];
  },
};
