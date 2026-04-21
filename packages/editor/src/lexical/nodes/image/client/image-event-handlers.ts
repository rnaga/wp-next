import { $getNodeByKey } from "lexical";
import {
  NodeEventHandler,
  NodeEventHandlers,
  NodeMutationEventHandler,
} from "../../../../client/node-event/types";
import { $updateCSS } from "../../../styles-core/css";
import { eventHandlers } from "../../../../client/node-event";

export const imageEventHandlers: NodeEventHandlers = {
  ...eventHandlers(),
  mousemove: (...args: Parameters<NodeEventHandler>) => {
    const { element, nodeKey, editor } = args[0];

    const prevTimeoutId = element?.getAttribute("data-resize-timeout-id");
    if (prevTimeoutId) {
      clearTimeout(parseInt(prevTimeoutId));
    }

    const width = element?.style.width;
    const height = element?.style.height;

    if (!width || !height) {
      return;
    }

    const timeoutId = setTimeout(() => {
      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey);
          const writable = node?.getWritable();
          $updateCSS({
            editor,
            node: writable,
            styles: {
              width,
              height,
            },
          });
        },
        {
          discrete: true,
        }
      );
    }, 200);

    element?.setAttribute("data-resize-timeout-id", String(timeoutId));
  },
};
