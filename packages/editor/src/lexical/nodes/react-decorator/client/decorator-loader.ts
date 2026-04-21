"use client";
import type * as types from "../../../../types";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  processAndGetTemplate,
  processAndGetTemplateSync,
} from "../../../template";
import {
  $walkNode,
  parseJsonString,
  parseJsonStringSync,
  walkNodeWithWidgets,
} from "../../../lexical";
import { $createTextNode, $getRoot, LexicalEditor } from "lexical";
import {
  $isReactDecoratorNode,
  REACT_DECORATOR_DATA_ATTRIBUTE,
  ReactDecoratorNode,
} from "../ReactDecoratorNode";
import { createLexicalEditor } from "../../../editor";
import {
  $isReactElementDecoratorNode,
  ReactElementDecoratorNode,
} from "../ReactElementDecoratorNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createGridNode } from "../../grid/GridNode";
import { $getAllCacheData, $storeCacheData } from "../../cache/CacheNode";
import { WidgetNode } from "../../widget/WidgetNode";
import { logger } from "../../../logger";

/**
 * Type union for validator functions that determine which decorator nodes to process.
 * Validators are type guard functions that check if a Lexical node is a specific decorator type.
 */
type Validator =
  | typeof $isReactDecoratorNode
  | typeof $isReactElementDecoratorNode;

/**
 * Union type representing valid decorator nodes that can be processed.
 * These nodes implement the decorate() method and have an ID property for DOM targeting.
 */
type ValidNode = ReactElementDecoratorNode | ReactDecoratorNode;

/**
 * Walks the Lexical editor tree and creates React portals for decorator nodes that match the provided validators.
 *
 * This function operates in two phases:
 * 1. Reads the Lexical editor state to find nodes matching the validator predicates
 * 2. For each matching node, creates a React portal that renders the node's decorated content
 *    into the corresponding DOM element (identified by the REACT_DECORATOR_DATA_ATTRIBUTE)
 *
 * Note: This function processes only ReactDecoratorNode and ReactElementDecoratorNode types
 * (based on the validators provided). It intentionally excludes WidgetNodes, which extend
 * WPDecoratorNode, since widgets are rendered server-side or via the preview layer in editor mode.
 *
 * @param editor - The Lexical editor instance to read from
 * @param element - The Document object to search for portal target elements
 * @param decorators - Array to accumulate created portals (mutated in place)
 * @param validators - Array of type guard functions to filter which nodes to process
 * @returns The decorators array with newly created portals appended
 */
const processAndGetDecorators = (
  editor: LexicalEditor,
  element: Document,
  decorators: ReturnType<typeof createPortal>[] = [],
  validators: Validator[] = [
    $isReactDecoratorNode,
    $isReactElementDecoratorNode,
  ]
) => {
  // Read operation ensures we're working with a consistent snapshot of the editor state
  editor.read(() => {
    // Walk the entire node tree starting from the root
    $walkNode($getRoot(), (node) => {
      // Check if this node matches any of the provided validator predicates
      if (validators.some((validator) => validator(node))) {
        const validNode = node as ValidNode;

        // Find all DOM elements that will serve as portal containers
        // Each decorator node has a unique ID that's used as a data attribute in the rendered HTML
        const targets = element.querySelectorAll(
          `[${REACT_DECORATOR_DATA_ATTRIBUTE}="${validNode.ID}"]`
        );

        // Create a portal for each matching DOM element
        targets.forEach((target, index) => {
          // Create a React portal that renders the decorated content into the target element
          // The decorate() method returns the React component/element to render
          // Use a unique key combining the node ID and index to avoid React key conflicts
          const uniqueKey = `${validNode.ID}-${index}`;
          decorators.push(
            createPortal(
              validNode.decorate?.apply(validNode),
              target,
              uniqueKey
            )
          );
        });
      }
    });
  });

  return decorators;
};

/**
 * Walks nested widget editor trees, creating React portals for matching decorator nodes.
 *
 * **Key Difference from processAndGetDecorators:**
 * - `processAndGetDecorators`: Only processes nodes in the root editor tree using `$walkNode`
 * - `processAndGetDecoratorsInWidgets`: Only processes nodes in nested widget editors (NOT the root editor) using `walkNodeWithWidgets`
 *
 * This function is essential for rendering decorators that exist inside WidgetNodes,
 * since widgets maintain their own separate Lexical editor instances. Without this traversal,
 * decorators inside widgets would not be discovered or rendered.
 *
 * Decorators in the root editor are handled separately and are not processed by this function.
 *
 * Operation:
 * 1. Uses `walkNodeWithWidgets` to traverse only widget editors (skips root editor nodes)
 * 2. For each node matching the validators, finds its corresponding DOM target element
 * 3. Clears the target element (via replaceChildren) to prevent duplicate content
 * 4. Creates a React portal rendering the decorator into the target element
 *
 * @param editor - The root Lexical editor instance (widgets will be discovered automatically)
 * @param element - The Document object to search for portal target elements
 * @param decorators - Array to accumulate created portals (mutated in place)
 * @param validators - Array of type guard functions to filter which nodes to process
 * @returns The decorators array with newly created portals appended
 */
export const processAndGetDecoratorsInWidgets = (
  editor: LexicalEditor, // Most likley it's the root editor but could be any editor with widgets
  element: Document,
  decorators: ReturnType<typeof createPortal>[] = [],
  validators: Validator[] = [
    $isReactDecoratorNode,
    $isReactElementDecoratorNode,
  ]
) => {
  // Track processed decorator IDs to prevent duplicates
  const processedIds = new Set<number>();

  // First get all widgets in the root editor
  const widgetNodes: WidgetNode[] = [];
  editor.read(() => {
    $walkNode($getRoot(), (node) => {
      if (node instanceof WidgetNode) {
        widgetNodes.push(node);
      }
    });
  });

  // Return early if no widgets found
  if (widgetNodes.length === 0) {
    return decorators;
  }

  // Now process each widget's editor state
  for (const widgetNode of widgetNodes) {
    const widgetEditor = widgetNode.editor;

    // widgetEditor shouldn't be null, but add a safeguard
    if (!widgetEditor) {
      logger.log(
        "Widget node has no editor instance, skipping:",
        widgetNode.getKey()
      );
      continue;
    }

    // Recursively traverse root editor + all nested widget editors
    // Unlike $walkNode (single editor only), walkNodeWithWidgets descends into WidgetNode editor states
    walkNodeWithWidgets(widgetEditor, (nestedEditor, node) => {
      // Apply validator type guards to filter for desired decorator node types
      if (validators.some((validator) => validator(node))) {
        const validNode = node as ValidNode;

        // Skip if we've already processed this decorator
        if (processedIds.has(validNode.ID)) {
          return;
        }

        // Locate all DOM elements where this decorator should render
        // Decorators use their unique ID as a data attribute selector
        const targets = element.querySelectorAll(
          `[${REACT_DECORATOR_DATA_ATTRIBUTE}="${validNode.ID}"]`
        );

        if (targets.length > 0) {
          const decoratorContent = validNode.decorate();

          // Create portal for each target DOM element to render the decorator's React content
          targets.forEach((target, index) => {
            // Use a unique key combining the node ID and index to avoid React key conflicts
            const uniqueKey = `${validNode.ID}-${index}`;
            decorators.push(createPortal(decoratorContent, target, uniqueKey));
          });

          // Mark this ID as processed
          processedIds.add(validNode.ID);
        }
      }
    });
  }

  return decorators;
};

/**
 * Base props for decorator processing functions.
 * Uses a discriminated union to ensure either templateId OR preload is provided, but not both.
 *
 * @property element - Optional Document object for finding portal target elements
 * @property templateId - Template ID to load (mutually exclusive with preload)
 * @property preload - Preloaded template data (mutually exclusive with templateId)
 */
type BaseProps = {
  element?: Document;
} & (
  | {
      templateId: number;
      preload?: never;
    }
  | {
      templateId?: never;
      preload: types.PreloadedTemplateMapping;
    }
);

/**
 * Retrieves and creates React portals for all decorator nodes in a template and its associated widgets.
 *
 * This function orchestrates the decorator processing workflow:
 * 1. Optionally loads and processes the root template (if excludeRoot is false)
 * 2. Processes ReactDecoratorNode instances from the root template
 * 3. Processes ReactElementDecoratorNode instances
 * 4. Recursively processes decorators in all widget editor states
 *
 * The function handles three types of decorators:
 * - ReactDecoratorNode: Standard decorator nodes from the root template
 * - ReactElementDecoratorNode: Element-based decorators
 * - Widget decorators: Nested editors for widget content
 *
 * @param props - Configuration object with template ID/preload data and processing options
 * @returns Promise resolving to an array of React portals ready to be rendered
 */
export const getDecorators = async (
  props: {
    excludeRoot: boolean;
    editor: LexicalEditor;
  } & BaseProps
) => {
  const { excludeRoot = false, editor, preload, element } = props;
  const templateId = props.templateId ?? preload?.template?.ID;

  // Early return if no target document is provided
  if (!element) {
    return [];
  }

  const decorators: ReturnType<typeof createPortal>[] = [];

  // Early return if no template is specified
  if (!templateId) {
    return [];
  }

  // Process root template decorators (unless explicitly excluded)
  if (!excludeRoot) {
    // Load and parse the template into the editor
    const result = await processAndGetTemplate(templateId, editor, {
      preload,
    });

    // Abort if template processing failed
    if (!result.valid) {
      return [];
    }

    // Process only ReactDecoratorNode instances from the root template
    processAndGetDecorators(editor, element, decorators, [
      $isReactDecoratorNode,
    ]);
  }

  // Process ReactElementDecoratorNode instances (always runs regardless of excludeRoot)
  processAndGetDecorators(editor, element, decorators, [
    $isReactElementDecoratorNode,
  ]);

  // Get widget global cache data if any
  const widgetCacheData = editor.read(() => $getAllCacheData())?.[
    "widget_global_cached_data"
  ];

  // Process widget decorators if any exist
  // Widgets are nested Lexical editors that may contain their own decorator nodes
  if (preload?.widgetEditorState) {
    for (const editorState of Object.values(preload.widgetEditorState)) {
      // Create a new editor instance for this widget, linked to the parent
      const widgetEditor = createLexicalEditor({
        parentEditor: editor,
      });

      // Restore any global cache data into the widget editor
      widgetEditor.update(
        () => {
          $storeCacheData(widgetCacheData ?? {});
        },
        {
          discrete: true,
        }
      );

      // Parse the widget's editor state into the new editor
      await parseJsonString(widgetEditor, editorState);

      // Process all decorator types in the widget editor (no validator filter)
      processAndGetDecorators(widgetEditor, element, decorators);
    }
  }

  return decorators;
};

export const getDecoratorsSync = (props: {
  excludeRoot: boolean;
  editor: LexicalEditor;
  element: Document;
}) => {
  const { excludeRoot = false, editor, element } = props;

  // Early return if no target document is provided
  if (!element) {
    return [];
  }

  const decorators: ReturnType<typeof createPortal>[] = [];
  const cacheData = editor.read(() => $getAllCacheData());

  // Process root template decorators (unless explicitly excluded)
  if (!excludeRoot) {
    const editorStateString = JSON.stringify(editor.getEditorState().toJSON());
    // Load and parse the template into the editor
    processAndGetTemplateSync(editor, editorStateString, cacheData ?? {});

    // Process only ReactDecoratorNode instances from the root template
    processAndGetDecorators(editor, element, decorators, [
      $isReactDecoratorNode,
    ]);
  }

  // Process ReactElementDecoratorNode instances (always runs regardless of excludeRoot)
  processAndGetDecorators(editor, element, decorators, [
    $isReactElementDecoratorNode,
  ]);

  // Get widget global cache data if any
  const widgetCacheData = editor.read(() => $getAllCacheData())?.[
    "widget_global_cached_data"
  ];

  let widgetEditorState: Record<string, string> = {};

  // Get widget state from cache data
  // key format: widget_{widgetSlug}_editor_state
  // TEMPORARY HACK: Pull widget editor state from cache using string parsing
  // TODO: This is a temporary solution with fragile logic. We need better code here:
  // - Use a more robust serialization format for cache keys
  // - Add proper typing and validation
  // - Consider a dedicated cache structure for widget editor states
  for (const [key, value] of Object.entries(cacheData ?? {})) {
    // Parse only widget editor states
    if (!key.startsWith("widget_") || !key.endsWith("_editor_state")) {
      continue;
    }

    // Pull out the widget slug from the key using hardcoded string indices
    const widgetSlug = key.slice(7, -13);
    widgetEditorState[widgetSlug] = value as string;
  }

  // Process widget decorators if any exist
  // Widgets are nested Lexical editors that may contain their own decorator nodes
  if (widgetEditorState) {
    for (const editorState of Object.values(widgetEditorState)) {
      // Create a new editor instance for this widget, linked to the parent
      const widgetEditor = createLexicalEditor({
        parentEditor: editor,
      });

      // Restore any global cache data into the widget editor
      widgetEditor.update(
        () => {
          $storeCacheData(widgetCacheData ?? {});
        },
        {
          discrete: true,
        }
      );

      // Parse the widget's editor state into the new editor
      parseJsonStringSync(widgetEditor, editorState);

      // Process all decorator types in the widget editor (no validator filter)
      processAndGetDecorators(widgetEditor, element, decorators);
    }
  }

  return decorators;
};

/**
 * React hook that manages decorator portals for the entire template including root and widgets.
 *
 * This hook:
 * 1. Maintains state for an array of React portals
 * 2. Fetches decorators on mount and when dependencies change
 * 3. Processes all decorator types (ReactDecoratorNode, ReactElementDecoratorNode, and widget decorators)
 *
 * Use this hook when you need to render a complete template with all its decorators.
 * For widget-only scenarios (excluding root decorators), use useWidgetReactDecorators instead.
 *
 * @param props - Configuration with template ID/preload data and target document
 * @returns Array of React portals to be rendered in the component tree
 */
// export const useReactDecorators = (
//   props: {
//     editor: LexicalEditor;
//   } & BaseProps
// ) => {
//   const [decorators, setDecorators] = useState<
//     ReturnType<typeof createPortal>[]
//   >([]);
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Skip if no target document is provided
//     if (!props.element) {
//       return;
//     }

//     (async () => {
//       const element = props.element;

//       // Fetch all decorators including root template decorators (excludeRoot: false)
//       const decorators = await getDecorators({
//         excludeRoot: false,
//         ...props,
//         element,
//       });

//       setDecorators(decorators);
//     })();
//   }, [props.element, props.editor, props.templateId, props.preload]);

//   return decorators;
// };

// export const useReactDecoratorsSync = (props: {
//   editor: LexicalEditor;
//   element: Document;
// }) => {
//   const [decorators, setDecorators] = useState<
//     ReturnType<typeof createPortal>[]
//   >([]);
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Skip if no target document is provided
//     if (!props.element) {
//       return;
//     }

//     setDecorators([]);

//     (async () => {
//       const element = props.element;

//       // Fetch all decorators including root template decorators (excludeRoot: false)
//       const decorators = getDecoratorsSync({
//         excludeRoot: false,
//         ...props,
//         element,
//       });

//       setDecorators(decorators);

//       return () => {
//         setDecorators([]);
//       };
//     })();
//   }, [props.element, props.editor]);

//   const reGenerateDecorators = () => {
//     const element = props.element;

//     // Fetch all decorators including root template decorators (excludeRoot: false)
//     setDecorators([]);

//     // Fetch all decorators including root template decorators (excludeRoot: false)
//     const decorators = getDecoratorsSync({
//       excludeRoot: false,
//       ...props,
//       element,
//     });

//     setDecorators(decorators);
//   };

//   return { decorators, reGenerateDecorators };
// };

/**
 * React hook that manages decorator portals for widgets only, excluding root template decorators.
 *
 * This hook is identical to useReactDecorators except it sets excludeRoot: true,
 * which skips processing ReactDecoratorNode instances from the root template.
 * It still processes:
 * - ReactElementDecoratorNode instances
 * - All decorators within widget editor states
 *
 * Use this hook when rendering widget content in isolation, where root template
 * decorators should not be included (e.g., in a widget preview or standalone widget renderer).
 *
 * @param props - Configuration with template ID/preload data and target document
 * @returns Array of React portals for widget decorators only
 */
// export const useWidgetReactDecorators = (props: UseReactDecoratorsProps) => {
//   const [decorators, setDecorators] = useState<
//     ReturnType<typeof createPortal>[]
//   >([]);

//   useEffect(() => {
//     // Skip if no target document is provided
//     if (!props.element) {
//       return;
//     }

//     (async () => {
//       const element = props.element;

//       // Fetch decorators excluding root template decorators (excludeRoot: true)
//       const decorators = await getDecorators({
//         excludeRoot: true,
//         ...props,
//         element,
//       });

//       setDecorators(decorators);
//     })();
//   }, [props.element, props.editor, props.templateId, props.preload]);

//   return decorators;
// };

// const Content = (props: { preload: types.PreloadedTemplateMapping }) => {
//   const { preload } = props;
//   const [editor] = useLexicalComposerContext();
//   const [decorators, setDecorators] = useState<
//     ReturnType<typeof createPortal>[]
//   >([]);

//   useEffect(() => {
//     (async () => {
//       if (!preload.template) {
//         return;
//       }

//       const result = await processAndGetTemplate(preload.template.ID, editor, {
//         preload,
//       });

//       if (!result.valid) {
//         return;
//       }

//       const decorators = processAndGetDecorators(editor);

//       // Process widgets
//       if (preload.widgetEditorState) {
//         for (const editorState of Object.values(preload.widgetEditorState)) {
//           const editor = createLexicalEditor();
//           await parseJsonString(editor, editorState, {
//             preload,
//           });
//           processAndGetDecorators(editor, decorators);
//         }
//       }

//       setDecorators(decorators);
//     })();
//   }, []);

//   return <>{decorators}</>;
// };
