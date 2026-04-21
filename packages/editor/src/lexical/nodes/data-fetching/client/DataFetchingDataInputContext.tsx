import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createContext, useContext, useEffect, useState } from "react";
import { useSelectedNode } from "../../../../client/global-event";
import { $getQueryCache } from "../../cache/CacheNode";
import {
  $getDataFileKeys,
  getPaginationKeys,
} from "../data-fetching-validator-utils";

import type * as types from "../../../../types";

const Context = createContext<{
  dataKeys: string[];
  widgetVariantKeys: string[];
  paginationKeys: string[];
}>({} as any);

export const useDataFetchingDataInput = () => {
  return useContext(Context);
};

export const DataFetchingDataInputContext = (props: {
  children: React.ReactNode;
}) => {
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();

  const [dataKeys, setDataKeys] = useState<string[]>([]);
  const [widgetVariantKeys, setWidgetVariantKeys] = useState<string[]>([]);
  const [paginationKeys, setPaginationKeys] = useState<string[]>([]);

  useEffect(() => {
    editor.read(() => {
      if (!selectedNode) return;

      const newDataFileKeys: string[] = $getDataFileKeys(editor, selectedNode);
      setDataKeys(newDataFileKeys);
    });
  }, [selectedNode]);

  // Read widgetVariants from the query cache (stored there by TemplateContext)
  // and re-derive keys whenever the editor state updates.
  useEffect(() => {
    const readVariantKeys = () => {
      let newKeys: string[] = [];
      editor.read(() => {
        const variants = $getQueryCache("widgetVariants") as
          | types.WidgetVariants
          | undefined;
        if (variants && Object.keys(variants).length > 0) {
          newKeys = Object.keys(variants).map((name) => `%variant.${name}`);
        }
      });
      // NOTE: setState is intentionally called outside editor.read().
      // Lexical's editor.read() can flush pending updates synchronously, which
      // fires registered update listeners (like this one). If setState were
      // called inside editor.read(), and another component calls editor.read()
      // during its render body, React would detect a state update mid-render and
      // throw "Cannot update a component while rendering a different component".
      setWidgetVariantKeys(newKeys);
    };

    readVariantKeys();
    return editor.registerUpdateListener(readVariantKeys);
  }, [editor]);

  useEffect(() => {
    const readPaginationKeys = () => {
      const newKeys = getPaginationKeys(editor);
      setPaginationKeys(newKeys);
    };

    readPaginationKeys();
    return editor.registerUpdateListener(readPaginationKeys);
  }, [editor]);

  return (
    <Context value={{ dataKeys, widgetVariantKeys, paginationKeys }}>
      {props.children}
    </Context>
  );
};
