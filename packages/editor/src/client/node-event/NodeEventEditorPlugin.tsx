import { COMMAND_PRIORITY_HIGH, Klass, LexicalNode } from "lexical";
import { useEffect, useRef } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useNodeEvent } from ".";

const registeredKlass: WeakSet<Klass<LexicalNode>> = new WeakSet();

export const NodeEventEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { klassNodeEventHandlers, getMutationParameters } = useNodeEvent();

  const entries = Array.from(klassNodeEventHandlers.entries());
  const removeListeners = useRef<any[]>([]);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    for (const [nodeType, { klassNode, eventHandlers }] of entries) {
      if (registeredKlass.has(klassNode)) {
        continue;
      }

      registeredKlass.add(klassNode);

      const removeListenerNodeMutaion = editor.registerMutationListener(
        klassNode,
        (mutations) => {
          editor.getEditorState().read(() => {
            for (const [key, mutation] of mutations) {
              const element: null | HTMLElement = editor.getElementByKey(key);

              const eventHandler = eventHandlers[`node-${mutation}`];
              if (eventHandler) {
                eventHandler(
                  getMutationParameters({
                    nodeKey: key,
                    klassNode,
                    element,
                  })
                );
              }
            }
          });
        },
        { skipInitialization: false }
      );

      removeListeners.current.push(removeListenerNodeMutaion);
    }

    return () => {
      for (const removeListener of removeListeners.current) {
        removeListener();
      }
    };
  }, [klassNodeEventHandlers]);

  return null;
};
