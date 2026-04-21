import { HISTORY_MERGE_TAG, LexicalEditor } from "lexical";

import { EDITOR_MODE_CONFIG_UPDATED_COMMAND } from "./commands";
import { $getMappedDynamicAttributesEditorModeConfig } from "./dynamic-attributes/DynamicAttributes";
import { walkNodeWithWidgets } from "./lexical";
import { $getAllCacheData, $storeCacheData } from "./nodes/cache/CacheNode";
import { $isWPLexicalNode, WPLexicalNode } from "./nodes/wp";
import { $getMappedCSSEditorModeConfig } from "./styles";

import type * as types from "../types";
import { isServerSide } from "./environment";
import { CSS_EDITOR_MODE_CONFIG_HIDDEN } from "./constants";

export const CACHE_KEY_EDITOR_MODE_CONFIG = "__editor_mode_config";

/**
 * This function updates editor mode configuration for matching WP Lexical nodes.
 * It then refreshes mapped config in cache and dispatches an update command for preview listeners.
 *
 * steps:
 * 1. Update editor mode config on matching nodes.
 * 2. Update cache with the latest mapped editor config.
 * 3. Trigger the editor mode config updated command.
 *
 * @param rootEditor - The root Lexical editor - not the nested editor within the widget node.
 * @param node - The WP Lexical node to match for updating editor mode config. The node can be the node within the nested editor.
 * @param resource - The type of editor mode config to update (e.g. "css" or "dynamicAttributes").
 * @param config - The partial editor mode config to merge into the node's existing config.
 * @returns void
 */
export const setEditorModeConfig = <T extends types.EditorModeConfigResource>(
  rootEditor: LexicalEditor,
  node: WPLexicalNode,
  resource: T,
  config: Partial<types.EditorModeConfig[T]>
) => {
  // TODO: should replace it with isEditorMode
  if (isServerSide()) {
    // Editor mode config is only relevant in the browser, so we can skip the update in server side rendering.
    throw new Error(
      "setEditorModeConfig should not be called in server side environment"
    );
  }

  // Get css className as a target.
  const cssClassName = rootEditor.read(() =>
    node.__css.getDebugEditorClassName()
  );

  walkNodeWithWidgets(rootEditor, (nestedEditor, node) => {
    nestedEditor.update(
      () => {
        if (!$isWPLexicalNode(node)) {
          return;
        }

        const nodeCssClassName = node.__css.getDebugEditorClassName();

        if (nodeCssClassName !== cssClassName) {
          return;
        }

        if (!$isWPLexicalNode(node)) {
          return;
        }

        // Now it's the target node to update editor config in cache.
        switch (resource) {
          case "css":
            node.getWritable().__css.mergeEditorModeConfig(config);
            break;

          case "dynamicAttributes":
            node
              .getWritable()
              .__dynamicAttributes.mergeEditorModeConfig(config);
            break;
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  });

  // Get the updated config from the node and set it in cache.
  const mappedConfig = getMappedEditorModeConfig(rootEditor)!;

  rootEditor.update(
    () => {
      $storeCacheData({ [CACHE_KEY_EDITOR_MODE_CONFIG]: mappedConfig });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  // Trigger lexical editor command to update editor config in preview iframes.
  rootEditor.dispatchCommand(EDITOR_MODE_CONFIG_UPDATED_COMMAND, {
    resource,
    mappedConfig,
  });
};

// This function is called followed by EDITOR_MODE_CONFIG_UPDATED_COMMAND via react component
// to walk through editor (and nested editors in widget nodes) and update css and dynamic attributes.
export const updateNodeElementsWithEditorModeConfig = (
  editor: LexicalEditor,
  options?: {
    mappedConfig?: types.EditorModeConfigMap;
  }
) => {
  const mappedConfig =
    options?.mappedConfig || getMappedEditorModeConfig(editor);

  if (!mappedConfig) {
    return;
  }

  // Walk through all nodes and update editor mode config for matching nodes based on the latest mapped config in cache.
  for (const resource of Object.keys(
    mappedConfig
  ) as types.EditorModeConfigResource[]) {
    walkNodeWithWidgets(editor, (nestedEditor, node) => {
      nestedEditor.update(
        () => {
          if (!$isWPLexicalNode(node)) {
            return;
          }

          const cssClassName = node.__css.getDebugEditorClassName();

          if (!mappedConfig[resource][cssClassName]) {
            return;
          }

          const configToUpdate = mappedConfig[resource][cssClassName];
          const nodeElement = nestedEditor.getElementByKey(node.getKey());

          switch (resource) {
            case "css":
              if (configToUpdate[CSS_EDITOR_MODE_CONFIG_HIDDEN] === false) {
                node.getWritable().__css.unsetDebugEditorStyles(["display"]);
              } else if (
                configToUpdate[CSS_EDITOR_MODE_CONFIG_HIDDEN] === true
              ) {
                node.getWritable().__css.setDebugEditorStyles({
                  display: "none",
                });
              }
              break;
            case "dynamicAttributes":
              node
                .getWritable()
                .__dynamicAttributes.mergeEditorModeConfig(configToUpdate);
              break;
          }
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    });
  }
};

/**
 *  This function restores editor mode config for both CSS and dynamic attributes
 *  from cache to matching nodes in the editor.
 *
 * @param editor - rootEditor or nestedEditor
 * @returns
 */
export const restoreEditorModeConfigFromCache = (editor: LexicalEditor) => {
  if (isServerSide()) {
    // Editor mode config is only relevant in the browser, so we can skip the restore in server side rendering.
    return;
  }

  const mappedConfig: types.EditorModeConfigMap = editor.read(() =>
    $getAllCacheData()
  )?.[CACHE_KEY_EDITOR_MODE_CONFIG];

  if (!mappedConfig) {
    return;
  }

  // Update editor mode config on matching nodes based on the latest mapped config in cache.
  for (const resource of Object.keys(
    mappedConfig
  ) as types.EditorModeConfigResource[]) {
    // Walk through all nodes and update editor mode config for matching nodes based on the latest mapped config in cache.
    walkNodeWithWidgets(editor, (nestedEditor, node) => {
      nestedEditor.update(
        () => {
          if (!$isWPLexicalNode(node)) {
            return;
          }

          const cssClassName = node.__css.getDebugEditorClassName();

          if (!mappedConfig[resource][cssClassName]) {
            return;
          }

          const configToRestore = mappedConfig[resource][cssClassName];

          switch (resource) {
            case "css":
              node.getWritable().__css.mergeEditorModeConfig(configToRestore);
              break;
            case "dynamicAttributes":
              node
                .getWritable()
                .__dynamicAttributes.mergeEditorModeConfig(configToRestore);
              break;
          }
        },

        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    });
  }
};

/**
 * This function retrieves the mapped editor configuration for both CSS and dynamic attributes.
 * It reads the editor state to gather the necessary information and returns it in a structured format.
 *
 * This is used to send editor config to FullPreviewLayer in the preview iframe,
 * so that the preview can apply the same editor config (e.g. hide dynamic attributes in preview if set in editor)
 *
 * This function returns undefined in server side rendering since editor mode config is only relevant in the browser.
 *
 * @param editor
 * @returns
 */
export const getMappedEditorModeConfig = (editor: LexicalEditor) => {
  if (isServerSide()) {
    // Editor mode config is only relevant in the browser, so we can skip the retrieval in server side rendering.
    return undefined;
  }

  let mappedConfig: types.EditorModeConfigMap = {
    css: {},
    dynamicAttributes: {},
  };

  editor.read(() => {
    const cssEditorConfig = $getMappedCSSEditorModeConfig();
    const dynamicAttributesEditorConfig =
      $getMappedDynamicAttributesEditorModeConfig();

    mappedConfig = {
      css: cssEditorConfig,
      dynamicAttributes: dynamicAttributesEditorConfig,
    };
  });

  return mappedConfig;
};
