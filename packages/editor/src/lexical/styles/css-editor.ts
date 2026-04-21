import {
  $getNodeByKey,
  $getRoot,
  HISTORY_MERGE_TAG,
  LexicalEditor,
  NodeKey,
} from "lexical";
import { $isWPLexicalNode, WPLexicalNode } from "../nodes/wp";
import {
  NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND,
  NODE_EDITOR_CSS_UPDATED_COMMAND,
} from "../commands";

import type * as types from "../../types";
import { $walkNode } from "../lexical";
import { cssKeyToKebabCase } from "./css-variables";
import { logger } from "../logger";

export const setEditorCSS = (
  editor: LexicalEditor,
  node: WPLexicalNode,
  css: types.CSSEditor
) => {
  editor.update(
    () => {
      node.__css.setEditorStyles(css);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const processEditorCSS = (editor: LexicalEditor) => {
  const cssProperties: Record<string, types.CSSEditor> = {};
  const classNameMap: Record<string, string> = {};
  editor.read(() => {
    const rootNode = $getRoot();

    $walkNode(rootNode, (node) => {
      if ($isWPLexicalNode(node)) {
        // Check if node has __cssEditor property and has at least one property
        const editorStyles = node.getLatest().getEditorCSS();

        classNameMap[node.getKey()] = node.__css.getEditorClassName();
        cssProperties[classNameMap[node.getKey()]] = { ...editorStyles };
      }
    });
  });

  editor.dispatchCommand(NODE_EDITOR_CSS_UPDATED_COMMAND, { cssProperties });

  editor.read(() => {
    for (const [nodeKey, className] of Object.entries(classNameMap)) {
      const targetElement = editor.getElementByKey(nodeKey);
      if (targetElement) {
        targetElement.classList.add(className);
      }
    }
  });
};

export const processDebugEditorCSS = (editor: LexicalEditor) => {
  const cssProperties: Record<string, types.CSSEditor> = {};
  const classNameMap: Record<string, string> = {};
  editor.read(() => {
    const rootNode = $getRoot();

    $walkNode(rootNode, (node) => {
      if ($isWPLexicalNode(node)) {
        // Check if node has __cssEditor property and has at least one property
        const debugEditorStyles = node.getLatest().__css.getDebugEditorStyles();

        classNameMap[node.getKey()] = node
          .getLatest()
          .__css.getDebugEditorClassName();
        cssProperties[classNameMap[node.getKey()]] = { ...debugEditorStyles };
      }
    });
  });

  if (Object.keys(cssProperties).length === 0) {
    logger.log(
      "No debug editor CSS properties to update, skipping dispatch."
    );
    return;
  }

  // Construct cssProperties to css string mapping for debug editor styles
  let cssString = "";
  for (const [className, styles] of Object.entries(cssProperties)) {
    cssString += `.${className} {`;
    for (const [prop, value] of Object.entries(styles)) {
      cssString += `${cssKeyToKebabCase(prop)}: ${value};`;
    }
    cssString += `} `;
  }

  editor.dispatchCommand(NODE_DEBUG_EDITOR_CSS_UPDATED_COMMAND, {
    cssProperties,
    cssString,
  });

  editor.read(() => {
    for (const [nodeKey, className] of Object.entries(classNameMap)) {
      const targetElement = editor.getElementByKey(nodeKey);
      if (targetElement) {
        targetElement.classList.add(className);
      }
    }
  });
};

export const removeEditorCSS = (
  editor: LexicalEditor,
  node: WPLexicalNode,
  propertyNames: string[] = []
) => {
  editor.update(
    () => {
      const editorStyles = node.__css.getEditorStyles();
      if (propertyNames.length === 0) {
        node.__css.setEditorStyles({});
      } else {
        for (const propName of propertyNames) {
          delete editorStyles[propName as keyof types.CSSEditor];
        }
        node.__css.setEditorStyles(editorStyles);
      }
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const removeAllEditorCSS = (
  editor: LexicalEditor,
  propertyNames: string[] = []
) => {
  editor.update(
    () => {
      const rootNode = $getRoot();

      $walkNode(rootNode, (node) => {
        removeEditorCSS(editor, node as WPLexicalNode, propertyNames);
      });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};
