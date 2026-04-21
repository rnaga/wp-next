import { LexicalNode } from "lexical";
import React, { createContext, JSX, useContext } from "react";

import { NodeContextMenu } from "./NodeContextMenu";
import { RootContextMenu } from "./RootContextMenu";
import { ContextMenuEventHandler } from "./types";

const contextMenuEventHanlderMap = new Map<string, ContextMenuEventHandler>();

const Context = createContext<{
  contextMenuEventHanlderMap: typeof contextMenuEventHanlderMap;
  registerContextMenuEventHandler: (
    klassNode: LexicalNode,
    handler: ContextMenuEventHandler
  ) => void;
}>({} as any);

export const useContextMenuContext = () => useContext(Context);

export const ContextMenuContext = (props: { children: React.ReactNode }) => {
  const registerContextMenuEventHandler = (
    klassNode: LexicalNode,
    handler: ContextMenuEventHandler
  ) => {
    contextMenuEventHanlderMap.set(klassNode.getType(), handler);
  };

  return (
    <Context
      value={{
        contextMenuEventHanlderMap,
        registerContextMenuEventHandler,
      }}
    >
      {props.children}
      <NodeContextMenu />
      <RootContextMenu />
    </Context>
  );
};
