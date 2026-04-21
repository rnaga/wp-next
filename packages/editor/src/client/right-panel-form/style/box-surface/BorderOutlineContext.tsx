import { createContext, useContext, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectedNode } from "../../../global-event";

import type * as types from "../../../../types";
import {
  borderHasValue,
  outlineHasValue,
} from "../../../../lexical/styles/box-surface";

type ContextValue = {
  borderValue: types.CSSBorder | undefined;
  outlineValue: types.CSSOutlineValue | undefined;
  setBorderValue: (value: types.CSSBorder | undefined) => void;
  setOutlineValue: (value: types.CSSOutlineValue | undefined) => void;
  shouldShowBorderRadius: boolean;
};

const Context = createContext<ContextValue | undefined>(undefined);

export const useBorderOutlineContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useBorderOutlineContext must be used within BorderOutlineContext"
    );
  }
  return context;
};

export const BorderOutlineContext = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [borderValue, setBorderValue] = useState<types.CSSBorder | undefined>();
  const [outlineValue, setOutlineValue] = useState<
    types.CSSOutlineValue | undefined
  >();

  // Sync with selected node
  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    const css = editor.read(() => selectedNode.getLatest()).__css.get();
    const newBorderValue = css?.__border as types.CSSBorder | undefined;
    const newOutlineValue = css?.__outline as types.CSSOutlineValue | undefined;

    setBorderValue(newBorderValue);
    setOutlineValue(newOutlineValue);
  }, [selectedNode, editor]);

  // Determine if BorderRadius should be shown
  const shouldShowBorderRadius =
    borderHasValue(borderValue) || outlineHasValue(outlineValue);

  return (
    <Context
      value={{
        borderValue,
        outlineValue,
        setBorderValue,
        setOutlineValue,
        shouldShowBorderRadius,
      }}
    >
      {children}
    </Context>
  );
};
