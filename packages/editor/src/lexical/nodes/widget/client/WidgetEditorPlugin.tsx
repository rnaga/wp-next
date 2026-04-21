import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  HISTORY_MERGE_TAG,
  LexicalNode,
} from "lexical";
import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import BorderAllIcon from "@mui/icons-material/BorderAll";

import { useDraggable } from "../../../../client/draggable";
//import { registerRightPanelForm } from "../../../../client/right-panel-form/RightPanelForm";
//import { StylesForm } from "../../../../client/right-panel-form/styles/Styles";
import {
  $checkNodeAndSyncCollectionElementNodesInCollection,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import {
  $isWidgetNode,
  processAllWidgets,
  processWidget,
  WidgetNode,
} from "../WidgetNode";
import { WidgetRightPanelForm } from "./WidgetRightPanelForm";
import {
  eventHandlers,
  NODE_PROPERTY_UPDATED,
  useNodeEvent,
} from "../../../../client/node-event";
import { WIDGET_SELECTED, WIDGET_SELECTED_AND_PROCESSED } from "../commands";
import { registerRightForms } from "../../../../client/right-panel-form/RightPanelForm";
import { StyleForm } from "../../../../client/right-panel-form/StyleForm";
import { useSelectedNode } from "../../../../client/global-event";
import { usePreviewLayer } from "../../../../client/preview-layer";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const WidgetEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { registerNodeEventHandler } = useNodeEvent();
  const { registerDraggable } = useDraggable();
  const { selectedNode } = useSelectedNode();
  const { iframeRef } = usePreviewLayer();
  const { wpHooks } = useWP();

  // Register Node Event Handlers
  useEffect(() => {
    registerNodeEventHandler({
      klassNode: WidgetNode,
      eventHandlers: eventHandlers(), //widgetEventHandlers,
    });
  }, []);

  // Register Draggable Element
  useEffect(() => {
    registerDraggable({
      klassNode: WidgetNode,
      priority: 20,
      type: "general",
      title: "widget",
      icon: BorderAllIcon,
    });
  }, []);

  // Register Right Panel Editor Form
  useEffect(() => {
    registerRightForms(WidgetNode.getType(), [
      { title: "Style", component: StyleForm },
      {
        title: "Settings",
        component: WidgetRightPanelForm,
      },
    ]);
  }, []);

  const processWidgets = async (
    widgetNode: WidgetNode,
    templateSlug: string
  ) => {
    await processWidget({
      nodeKey: widgetNode.getKey(),
      editor,
      options: {
        forceUpdate: true,
      },
    });

    await processAllWidgets(editor);

    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      node: widgetNode,
    });

    wpHooks.action.doCommand(WIDGET_SELECTED_AND_PROCESSED, {
      node: widgetNode,
      slug: templateSlug,
    });
  };

  useEffect(() => {
    return editor.registerCommand(
      WIDGET_SELECTED,
      ({ node, slug }) => {
        let writable = node.getWritable() as WidgetNode;

        if (!$isWidgetNode(writable)) return false;
        writable.slug = slug;

        $checkNodeAndSyncCollectionElementNodesInCollection(writable);

        processWidgets(writable, slug).then(() => {
          editor.update(
            () => {
              const writable = node.getWritable() as WidgetNode;
              // After processing the widget, sync parent collections
              $syncParentCollections(writable);
            },
            {
              tag: HISTORY_MERGE_TAG,
            }
          );
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  // useEffect(() => {
  //   if (!$isWidgetNode(selectedNode)) return;
  //   if (!iframeRef?.current?.contentDocument) return;

  //   // When a widget node is selected, check and update innerHTML
  //   // This is needed as there can be React components inside widget nodes
  //   // which need to be re-processed to reflect changes
  //   const iframeDocument = iframeRef.current.contentDocument;

  //   // updateWidgetInnerHTML(editor, selectedNode, iframeDocument);

  //   // // Check if there are any rendered React decorator elements that need to be preserved
  //   // // These elements have the data-decorator-id attribute and may contain React-rendered content
  //   // const editorClassName = selectedNode.__css.getEditorClassName();
  //   // if (!editorClassName) return;

  //   // // Get the widget element in the iframe document
  //   // const widgetElement = iframeDocument.querySelector<HTMLElement>(
  //   //   `.${editorClassName}`
  //   // );

  //   // // Then update widgetNode innerHTML with preserved decorator elements
  //   // if (widgetElement) {
  //   //   editor.update(
  //   //     () => {
  //   //       const writable = selectedNode.getWritable() as WidgetNode;
  //   //       writable.innerHTML = widgetElement.innerHTML;

  //   //       // Increment htmlIncrementalId not to overwrite innerHTML in updateDOM
  //   //       writable.htmlIncrementalId++;
  //   //     },
  //   //     {
  //   //       discrete: true,
  //   //     }
  //   //   );
  //   // }
  // }, [selectedNode, iframeRef]);

  return null;
};
