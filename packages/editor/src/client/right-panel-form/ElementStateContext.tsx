import React, {
  createContext,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelectedNode } from "../global-event";
import { CSSEditorElementState } from "../../lexical/styles-core/css-editor-element-state";
import type * as types from "../../types";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND } from "./commands";

const Context = createContext<{
  elementState: types.CSSState;
  updateElementState: (state: types.CSSState) => void;
  elementStateRef: RefObject<types.CSSState>;
}>({} as any);

export const useElementState = () => {
  return useContext(Context);
};

export const ElementStateContext = (props: { children: React.ReactNode }) => {
  const [elementState, setElementState] = useState<types.CSSState>("none");
  const elementStateRef = useRef(elementState);
  const { selectedNode } = useSelectedNode();
  const { wpHooks } = useWP();

  const updateElementState = (state: types.CSSState) => {
    elementStateRef.current = state;
    CSSEditorElementState.setCurrent(state);
    setElementState(state);
    wpHooks.action.doCommand(CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND, {
      elementState: state,
    });
  };

  useEffect(() => {
    updateElementState("none");
    CSSEditorElementState.setSelectedNode(selectedNode);
  }, [selectedNode]);

  return (
    <Context
      value={{
        elementState,
        updateElementState,
        elementStateRef,
      }}
    >
      {props.children}
    </Context>
  );
};
