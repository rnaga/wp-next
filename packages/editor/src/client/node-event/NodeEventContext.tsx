"use client";
import { Klass, LexicalNode } from "lexical";
import { createContext, useContext, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { NodeEventHandlers, NodeType } from "./types";

type KlassNodeEvent = {
  klassNode: Klass<LexicalNode>;
  eventHandlers: NodeEventHandlers;
};

const Context = createContext<{
  registerNodeEventHandler: (klassNodeEventHandlers: KlassNodeEvent) => void;
  klassNodeEventHandlers: Map<NodeType, KlassNodeEvent>;
}>({
  registerNodeEventHandler: () => {},
  klassNodeEventHandlers: new Map(),
});

export const useNodeEventContext = () => useContext(Context);

export const NodeEventContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const [klassNodeEventHandlers, setEventHandlers] = useState<
    Map<NodeType, KlassNodeEvent>
  >(new Map());
  const [editor] = useLexicalComposerContext();

  const registerNodeEventHandler = (value: KlassNodeEvent) => {
    setEventHandlers((prev) => {
      const newMap = new Map(prev).set(value.klassNode.getType(), value);
      return newMap;
    });
  };

  return (
    <Context
      value={{
        klassNodeEventHandlers,
        registerNodeEventHandler,
      }}
    >
      {children}
    </Context>
  );
};
