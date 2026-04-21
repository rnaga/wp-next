import { createContext, useContext, useRef, useState } from "react";
import { Klass, LexicalNode } from "lexical";
import { useDragDrop } from "../drag-drop";

import type * as types from "../../types";

const Context = createContext<{
  draggableElements: Map<Klass<LexicalNode>, types.DraggableContextValue>;
  registerDraggable: (value: types.DraggableContextValue) => void;
}>({
  draggableElements: new Map(),
  registerDraggable: () => {},
});

export const useDraggableContext = () => useContext(Context);

export const DraggableContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const [draggableElements, setDraggables] = useState<
    Map<Klass<LexicalNode>, types.DraggableContextValue>
  >(new Map());

  const registerDraggable = (value: types.DraggableContextValue) => {
    setDraggables((prev) => {
      const newMap = new Map(prev).set(value.klassNode, value);
      return newMap;
    });
  };

  return (
    <Context value={{ draggableElements, registerDraggable }}>
      {children}
    </Context>
  );
};
