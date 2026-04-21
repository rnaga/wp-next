import {
  $getRoot,
  createEditor,
  CreateEditorArgs,
  HISTORY_MERGE_TAG,
} from "lexical";
import { getWPLexicalNodes, registerNodeCreators } from "./nodes";
import {
  $createCacheNode,
  $isCacheNode,
  CacheNode,
  syncCacheData,
} from "./nodes/cache/CacheNode";
import { $walkNode } from "./walk-node";
import { logger } from "./logger";

export const getLexicalEditorConfig = <T extends CreateEditorArgs = any>(
  args?: CreateEditorArgs & {
    isHeadless?: boolean;
    isEditing?: boolean;
  }
): T => {
  const {
    namespace = args?.isEditing ? "editing" : "reading",
    onError = (error: Error) => {
      logger.error( error);
      // Re-throw to ensure errors are not silently swallowed by Lexical's internal error handling.
      throw error;
    },
    editable = false,
    isHeadless = false,
  } = args || {};

  return {
    namespace,
    theme: {},
    onError,
    nodes: getWPLexicalNodes(),
    editable,
    editorState: null as any,
  } as unknown as T;
};

export const createLexicalEditor = (
  args?: CreateEditorArgs & {
    isHeadless?: boolean;
    isEditing?: boolean;
  }
) => {
  const { isHeadless = false, parentEditor } = args || {};

  // Register node creators
  registerNodeCreators();

  const editorConfig = getLexicalEditorConfig(args);
  const editor = createEditor(editorConfig);

  // Headless mode for server side rendering
  if (isHeadless) {
    editor._headless = true;

    const unsupportedMethods = [
      "registerDecoratorListener",
      "registerRootListener",
      "registerMutationListener",
      "getRootElement",
      "setRootElement",
      "getElementByKey",
      "focus",
      "blur",
    ] as const;

    unsupportedMethods.forEach(
      (method: (typeof unsupportedMethods)[number]) => {
        editor[method] = () => {
          throw new Error(`${method} is not supported in headless mode`);
        };
      }
    );
  }

  // If parent editor is provided, sync cache data
  if (parentEditor) {
    // Check for CacheNode in child editor
    const hasCacheNode = editor.getEditorState().read(() => {
      let found = false;
      $walkNode($getRoot(), (node) => {
        if ($isCacheNode(node)) {
          found = true;
        }
      });
      return found;
    });

    // If no CacheNode found, create one and append to root
    if (!hasCacheNode) {
      editor.update(
        () => {
          $getRoot().append($createCacheNode());
        },
        { discrete: true, tag: HISTORY_MERGE_TAG }
      );
    }

    syncCacheData(parentEditor, editor);
  }

  return editor;
};
