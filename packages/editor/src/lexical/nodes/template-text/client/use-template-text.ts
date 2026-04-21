import { useCallback, useEffect, useState } from "react";
import { COMMAND_PRIORITY_HIGH } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { $isTemplateTextNode, $loadTemplateText } from "../TemplateTextNode";

export const useTemplateText = () => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [template, setTemplate] = useState<string>("");

  const getLatestTemplate = useCallback(
    () =>
      editor.read(() => {
        const latestNode = selectedNode?.getLatest();
        return $isTemplateTextNode(latestNode) ? latestNode.__template : "";
      }),
    [editor, selectedNode]
  );

  useEffect(() => {
    const latestTemplate = getLatestTemplate();
    setTemplate(latestTemplate);
  }, [getLatestTemplate]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (node.getKey() !== selectedNode?.getKey()) {
          return false;
        }

        const latestTemplate = getLatestTemplate();

        setTemplate((prev) =>
          prev === latestTemplate ? prev : latestTemplate
        );
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, getLatestTemplate, selectedNode]);

  const handleChange = (value: string) => {
    if (!$isTemplateTextNode(selectedNode)) return;

    setTemplate(value);

    editor.update(
      () => {
        const writable = selectedNode?.getWritable();
        if (!writable) return;
        writable.setTemplate(value);
        $loadTemplateText(writable);
      },
      {
        discrete: true,
      }
    );

    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: selectedNode,
    });
  };

  return { template, handleChange, selectedNode };
};
