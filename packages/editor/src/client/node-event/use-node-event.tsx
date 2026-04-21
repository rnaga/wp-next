"use client";
import { $getNodeByKey, Klass, LexicalNode } from "lexical";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $getKlassNodeByType, $isLexicalNode } from "../../lexical";
import { useGlobalEvent } from "../global-event/use-global-event";
import { useTemplate } from "../template/use-template";
import { useNodeEventContext } from "./NodeEventContext";
import {
  NodeEventHandler,
  NodeEventHandlerParameters,
  NodeMutationEventHandlerParameters,
} from "./types";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const useNodeEvent = () => {
  const context = useNodeEventContext();

  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const { getParameters: getGlobalEventParameters } = useGlobalEvent();
  const template = useTemplate();

  const getParameters = (args: {
    nodeKey: string;
    event: Event;
    klassNode?: Klass<LexicalNode>;
    element: HTMLElement | null;
  }): NodeEventHandlerParameters => {
    const { nodeKey, klassNode, event, element } = args;
    const globalEventParameters = getGlobalEventParameters(event);

    return {
      element,
      klassNode,
      nodeKey,
      template,
      wpHooks,
      ...globalEventParameters,
    };
  };

  const getMutationParameters = (args: {
    nodeKey: string;
    klassNode: Klass<LexicalNode>;
    element: HTMLElement | null;
  }): NodeMutationEventHandlerParameters => {
    const { nodeKey, klassNode, element } = args;
    const globalEventParameters = getGlobalEventParameters();
    return {
      element,
      klassNode,
      nodeKey,
      template,
      wpHooks,
      ...globalEventParameters,
    };
  };

  const addNodeEventListener = (
    element: HTMLElement,
    eventType: string,
    nodeKeyOrNode: string | LexicalNode,
    handler: NodeEventHandler
  ) => {
    const node = $isLexicalNode(nodeKeyOrNode)
      ? nodeKeyOrNode
      : editor.read(() => $getNodeByKey(nodeKeyOrNode));

    if (!node) {
      logger.error("Node not found for key", nodeKeyOrNode);
      return () => {};
    }

    const nodeElement = editor.read(() =>
      editor.getElementByKey(node.getKey())
    );

    const klassNode = editor.read(() => $getKlassNodeByType(node!.getType()));

    const handlerWrapper = (event: Event) => {
      handler(
        getParameters({
          event,
          klassNode,
          nodeKey: node.getKey(),
          element: nodeElement,
        })
      );
    };

    element.addEventListener(eventType, handlerWrapper);

    return () => {
      element.removeEventListener(eventType, handlerWrapper);
    };
  };

  return {
    ...context,
    getParameters,
    getMutationParameters,
    addNodeEventListener,
  };
};
