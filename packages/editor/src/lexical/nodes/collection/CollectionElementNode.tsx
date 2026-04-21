import {
  $isRootNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  Spread,
} from "lexical";

import { $isLexicalNode, $walkNode } from "../../walk-node";
import { $getFetchedData } from "../data-fetching/DataFetchingNode";
import { LinkNode } from "../link/LinkNode";
import { TemplateTextNode } from "../template-text/TemplateTextNode";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";
import {
  $deferredIsLinkRelatedNode,
  $deferredIsTemplateTextNode,
  $isCollectionNodeGuard,
} from "./sync";

import type { CollectionNode } from "./CollectionNode";
import type { WPLexicalNode } from "../wp/types";
import { logger } from "../../logger";

export type SerializedCollectionElementNode = Spread<
  {
    __isCollectionElement: boolean;
  },
  SerializedWPElementNode
>;

export class CollectionElementNode extends WPElementNode {
  __isCollectionElement = true;

  // Collection element nodes are not editable via the UI
  __editableMouseTool: boolean = false;
  __editableContextMenu: boolean = false;

  boolean = false;

  __removable: boolean = false;

  static getType() {
    return "collection-element";
  }

  static clone(node: CollectionElementNode) {
    const newNode = new CollectionElementNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  getDataIndexAndDataKeyForThisElement(): {
    index: number;
    dataKey: string;
    itemName?: string;
  } | null {
    const parentCollection = this.getParent() as CollectionNode;
    if (!parentCollection || !$isCollectionNodeGuard(parentCollection)) {
      return null;
    }

    // Find the index of this element within the parent collection
    const collectionElementNodes = parentCollection
      .getChildren()
      .filter($isCollectionElementNode);

    const myIndex = collectionElementNodes.findIndex(
      (node) => node.getKey() === this.getKey()
    );

    if (myIndex === -1) {
      return null;
    }

    return {
      index: myIndex,
      dataKey: parentCollection.getDataName(),
      itemName: parentCollection.getItemName(),
    };
  }

  /**
   * Get the data for this collection element by computing it from the parent CollectionNode
   * This replaces the need to store contextData on child WidgetNodes
   */
  getDataForThisElement(): Record<string, any> | undefined {
    const parentCollection = this.getParent() as CollectionNode;
    if (!parentCollection || !$isCollectionNodeGuard(parentCollection)) {
      return undefined;
    }

    const indexAndDatakey = this.getDataIndexAndDataKeyForThisElement();
    if (indexAndDatakey === null) {
      return undefined;
    }
    const { index: myIndex, dataKey } = indexAndDatakey;

    // Get the data name and field from parent collection
    const dataNameDotField = dataKey;
    const [name, field] = dataNameDotField.split(".");

    const itemName = parentCollection.getItemName();

    // $consoleCacheData();

    let cachedData = $getFetchedData(name);

    // If no cached data found for this name, it may reference a parent collection's itemName
    // (e.g. "items" in "items.categories" where "items" is the outer collection's itemName).
    // Resolve by getting data from the ancestor CollectionElementNode's context.
    if (!cachedData) {
      const ancestorCollectionElement =
        $findParentCollectionElementNode(parentCollection);
      if (ancestorCollectionElement) {
        const ancestorData = ancestorCollectionElement.getDataForThisElement();
        cachedData = ancestorData?.[name];
      }
    }

    if (!cachedData) {
      return {
        // Return empty object to override any stale collection data from widget_global_cached_data
        // inherited from parent editor. This ensures widgets in collections use correct item-specific
        // data rather than generic cached data that doesn't match this element's index.
        [itemName]: {},
      };
    }

    // Get the array data
    //const nodeData = !field ? dataNode.getData() : dataNode.getData()?.[field];
    let nodeData = !field ? cachedData : cachedData?.[field];

    if (!Array.isArray(nodeData)) {
      return undefined;
    }

    // If no data for this index, return empty object
    if (nodeData.length <= myIndex) {
      return { [itemName]: {} };
    }

    // Return the data for this specific element
    const data = nodeData[myIndex];
    const passingData = {
      [itemName]: data,
    };
    // field && 0 < field.length
    //   ? { [name]: { [field]: data } }
    //   : { [name]: data };

    return passingData;
  }

  refreshNodes() {
    const parentCollection = this.getParent() as CollectionNode;
    if (!parentCollection) {
      logger.log(
        "No parent collection found for collection element node",
        this
      );
      return;
    }

    const data = this.getDataForThisElement();

    $walkNode(this, (node) => {
      // Ensure that node isn't in another nested collection
      // Skip if it is because we only want to update nodes in the same collection
      const closestCollectionNode = node
        .getParents()
        .find($isCollectionNodeGuard);
      if (closestCollectionNode?.getKey() !== parentCollection.getKey()) {
        logger.log(
          "[refreshTemplateNodes] Node is in another collection, skipping to refresh downstream data",
          node
        );
        return;
      }

      if ($deferredIsTemplateTextNode(node)) {
        const writable = node.getWritable() as TemplateTextNode;
        writable.loadText({ data });
      }

      if ($deferredIsLinkRelatedNode(node)) {
        const writable = node.getWritable() as LinkNode;
        writable.loadLink({ data });
      }
    });
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(
    prevNode: CollectionElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(
    serializedNode: SerializedCollectionElementNode
  ): CollectionElementNode {
    const node = new CollectionElementNode();
    node.importJSON(serializedNode);
    node.__isCollectionElement = serializedNode.__isCollectionElement;
    return node;
  }

  exportJSON(): SerializedCollectionElementNode {
    return {
      ...super.exportJSON(),
      __isCollectionElement: this.__isCollectionElement,
      type: "collection-element",
    };
  }
}

export const $createCollectionElementNode = (node?: CollectionElementNode) => {
  const collectionElement = new CollectionElementNode();
  $afterWPElementNodeCreation(collectionElement, node);
  return collectionElement;
};

export const $isCollectionElementNode = (
  node: any
): node is CollectionElementNode =>
  node instanceof CollectionElementNode || node?.__isCollectionElement;

export const $getCollectionElementData = (
  node: WPLexicalNode | null | undefined
) => {
  let parent = node?.getParent() as LexicalNode | null | undefined;
  while (
    $isLexicalNode(parent) &&
    !$isRootNode(parent) &&
    !$isCollectionNodeGuard(parent)
  ) {
    if ($isCollectionElementNode(parent)) {
      const collectionElementNode = parent as CollectionElementNode;
      const dataForThisElement = collectionElementNode.getDataForThisElement();
      return dataForThisElement;
    }
    parent = parent?.getParent();
  }
  return undefined;
};

/**
 * Find the closest parent CollectionElementNode by traversing up the node tree
 * @param node - The starting node (typically a TemplateTextNode)
 * @returns The parent CollectionElementNode or undefined if not found
 */
export const $findParentCollectionElementNode = (
  node: LexicalNode
): CollectionElementNode | undefined => {
  let currentNode: LexicalNode | null = node;

  // Traverse up the parent chain until we find a CollectionElementNode or reach the root
  while (currentNode) {
    if ($isCollectionElementNode(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.getParent();
  }

  return undefined;
};

export const $isInCollectionElementNode = (node: LexicalNode): boolean => {
  return $findParentCollectionElementNode(node) !== undefined;
};
