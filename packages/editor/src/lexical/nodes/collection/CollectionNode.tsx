import {
  $getEditor,
  $getRoot,
  $isTextNode,
  EditorConfig,
  ElementNode,
  Klass,
  LexicalEditor,
  LexicalNode,
  Spread,
} from "lexical";

import {
  $deferredCreateNode,
  $deferredDeepCopy,
  deferredWalkNodeWithWidgets,
} from "../../deferred";
import { walkNodeWithWidgets } from "../../lexical";
import { logger } from "../../logger";
import { $walkNode } from "../../walk-node";
import {
  $getFetchedData,
  $isDataFetchingNode,
  $storeFetchedData,
  DataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";
import {
  $createCollectionElementNode,
  $findParentCollectionElementNode,
  $isCollectionElementNode,
  CollectionElementNode,
} from "./CollectionElementNode";

import type { WPLexicalNode } from "../wp/types";
export type SerializedCollectionNode = Spread<
  {
    __name: string;
    __dataNodeNameDotField: string;
    __itemName: string;
    __elementMaxLength: number;
  },
  SerializedWPElementNode
>;

export class CollectionNode extends WPElementNode {
  // Collection name. Set random string by default
  __name: string = getDefaultCollectionName();

  // This refers to DataFetchingNode name and optional field, e.g. "posts.items"
  __dataNodeNameDotField: string = "";

  // This refers to item name within the template node. e.g. ${item.post_title}
  __itemName: string = "item";
  __elementMaxLength: number = 2;

  static getType() {
    return "collection";
  }

  setName(name: string) {
    this.__name = name;
  }

  getName() {
    return this.__name;
  }

  getDataName() {
    return this.__dataNodeNameDotField;
  }

  setDataName(dataNodeNameDotField: string) {
    this.__dataNodeNameDotField = dataNodeNameDotField;
  }

  getItemName() {
    return this.__itemName ?? "item";
  }

  setItemName(itemName: string) {
    this.__itemName = itemName;
  }

  setElementMaxLength(length: number) {
    this.__elementMaxLength = length;
    // Mark the node as dirty to trigger update
    this.markDirty();
  }

  getElementMaxLength() {
    return this.__elementMaxLength;
  }

  refreshData() {
    //$consoleCacheData();

    // Sync collection element nodes in collection node
    // to make sure the number of collection element nodes is correct according to the fetched data length and element max length.
    //
    // This will also update the template nodes in each collection element node with the correct data.
    //$syncCollectionElementNodesInCollection(this);

    // Get all children of type CollectionElementNode
    const collectionElementNodes = this.getChildren()
      .filter($isCollectionElementNode)
      .filter((node) => node.getParent()?.getKey() === this.getKey());

    for (const [
      index,
      collectionElementNode,
    ] of collectionElementNodes.entries()) {
      collectionElementNode.refreshNodes();
    }
  }

  static clone(node: CollectionNode) {
    const newNode = new CollectionNode(node.__key);
    newNode.afterClone(node);
    newNode.__name = node.__name || getDefaultCollectionName();
    newNode.__dataNodeNameDotField = node.__dataNodeNameDotField;
    newNode.__itemName = node.__itemName;
    newNode.__elementMaxLength = node.__elementMaxLength;
    return newNode;
  }

  isEmpty(): boolean {
    // Get collection element nodes
    const firstCollectionElementNodes = this.getChildren().filter(
      $isCollectionElementNode
    )?.[0];

    // Check if the first collection element node is empty
    if (firstCollectionElementNodes) {
      return firstCollectionElementNodes.isEmpty();
    }

    return super.isEmpty() || this.__elementMaxLength == 0;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    //element.innerText = `Collection Node - ${this.__key} --${this.getIndent()}`;
    this.__css.setDefault({
      padding: "20px",
    });
    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(
    prevNode: CollectionNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(serializedNode: SerializedCollectionNode): CollectionNode {
    const node = new CollectionNode();
    node.importJSON(serializedNode);
    node.__name = serializedNode.__name || getDefaultCollectionName();
    node.__dataNodeNameDotField = serializedNode.__dataNodeNameDotField;
    node.__itemName = serializedNode.__itemName;
    node.__elementMaxLength = serializedNode.__elementMaxLength;
    return node;
  }

  exportJSON(): SerializedCollectionNode {
    return {
      ...super.exportJSON(),
      type: this.getType(),
      __name: this.__name,
      __dataNodeNameDotField: this.__dataNodeNameDotField,
      __itemName: this.__itemName,
      __elementMaxLength: this.__elementMaxLength,
      version: 1,
    };
  }
}

const getDefaultCollectionName = () => {
  return `collection-${Math.random().toString(36).slice(2, 11)}`;
};

export const $createCollectionNode = (node?: CollectionNode) => {
  const collection = new CollectionNode();
  $afterWPElementNodeCreation(collection, node);
  if (node) {
    collection.__name = node.__name;
    collection.__dataNodeNameDotField = node.__dataNodeNameDotField;
    collection.__itemName = node.__itemName;
    collection.__elementMaxLength = node.__elementMaxLength;
  }
  return collection;
};

export const $isCollectionNode = (node: any): node is CollectionNode =>
  node instanceof CollectionNode || node?.getType() === "collection";

/**
 * Synchronizes CollectionElementNodes within a CollectionNode.
 *
 * This is the core function responsible for creating, cloning, and maintaining the repeating
 * element structure within a collection. The actual element count is dynamically determined
 * by $getCollectionElementLength (min of fetched data length and elementMaxLength).
 *
 * @param collectionNode - The CollectionNode to synchronize
 * @param child - Optional CollectionElementNode to use as a template for cloning.
 *                If provided, this child is preserved and N-1 copies are created.
 *                If not provided, uses the first existing CollectionElementNode as template,
 *                or creates N empty CollectionElementNodes if none exist.
 * @param options - Optional configuration
 * @param options.exclude - Array of nodes to exclude from the deep copy operation.
 *                          Useful when removing a node from the template to prevent it
 *                          from being cloned into other collection elements.
 *
 * @example
 * // Create a new collection with 3 empty elements
 * const collection = $createCollectionNode();
 * collection.setElementMaxLength(3);
 * $syncCollectionElementNodesInCollection(collection);
 * // Result: collection now has 3 empty CollectionElementNodes
 *
 * @example
 * // Sync collection using first element as template
 * const collection = $getNodeByKey('collection-key') as CollectionNode;
 * const firstElement = collection.getChildren()[0] as CollectionElementNode;
 * // User adds content to firstElement...
 * $syncCollectionElementNodesInCollection(collection, firstElement);
 * // Result: firstElement preserved, and (computedLength - 1) clones created
 *
 * @example
 * // Exclude a specific node when syncing (e.g., when removing a widget)
 * const nodeToRemove = $getNodeByKey('widget-key');
 * $syncCollectionElementNodesInCollection(collection, firstElement, {
 *   exclude: [nodeToRemove]
 * });
 * // Result: nodeToRemove won't be copied to other CollectionElementNodes
 *
 * **Algorithm:**
 * 1. Determine target count via $getCollectionElementLength (or count - 1 if child is provided)
 * 2. Identify template: use provided child, or first existing CollectionElementNode, or null
 * 3. Remove all existing children except the provided child (if any)
 * 4. Create N new CollectionElementNodes:
 *    - If template exists: deep copy it N times (respecting exclude option)
 *    - If no template: create N empty CollectionElementNodes
 * 5. Attach each new node to the collection with syncCollection=false to prevent recursion
 * 6. Call refreshData() to update all template nodes (TemplateTextNodes, etc.) with current data
 *
 * **Important Notes:**
 * - This function performs destructive operations - it removes all existing children (except provided child)
 * - Deep copying preserves the entire node tree structure, including CSS, attributes, and nested nodes
 * - The exclude option allows selective omission of nodes during the copy process
 * - Setting syncCollection=false during attach prevents infinite recursion
 * - refreshData() is crucial - it populates TemplateTextNodes with data based on each element's index
 *
 * **Relationship with $syncParentCollections:**
 * These two functions work together to maintain collection consistency:
 * - $syncCollectionElementNodesInCollection (this function): Operates DOWNWARD on a single collection
 *   - Takes a CollectionNode and regenerates all its child CollectionElementNodes
 *   - Called when you know which specific collection needs syncing
 * - $syncParentCollections: Operates UPWARD from any node
 *   - Takes any node and finds all ancestor collections, then calls this function for each
 *   - Called when a node is modified and changes need to propagate up the hierarchy
 *
 * In practice:
 * - Use THIS function when: initializing collections, changing elementMaxLength, direct collection manipulation
 * - Use $syncParentCollections when: modifying nodes within collections, adding/removing child nodes
 * - $syncParentCollections internally calls THIS function, so you rarely need both
 *
 * **When to call this function:**
 * - After creating a new CollectionNode (to initialize its structure)
 * - When elementMaxLength changes (to add/remove CollectionElementNodes)
 * - When the template structure changes (to propagate changes across all elements)
 * - When you have a direct reference to the CollectionNode and know it needs syncing
 * - Note: If you're modifying a child node, prefer $syncParentCollections instead
 */
/**
 * Computes the actual number of CollectionElementNodes to create for a CollectionNode.
 *
 * Takes the minimum of:
 * - The fetched data array length (from CacheNode via $getFetchedData)
 * - The configured elementMaxLength
 *
 * Falls back to elementMaxLength when no fetched data is available.
 */
export const $getCollectionElementLength = (
  collectionNode: CollectionNode
): number => {
  const maxLength = collectionNode.getElementMaxLength();

  const dataNameDotField = collectionNode.getDataName();
  if (!dataNameDotField) {
    return maxLength;
  }

  const [name, field] = dataNameDotField.split(".");
  let cachedData = $getFetchedData(name);

  // If no cached data found for this name, it may reference a parent collection's itemName
  // (e.g. "items" in "items.categories" where "items" is the outer collection's itemName).
  // Resolve by getting data from the ancestor CollectionElementNode's context.
  if (!cachedData) {
    const ancestorCollectionElement =
      $findParentCollectionElementNode(collectionNode);
    if (ancestorCollectionElement) {
      const ancestorData = ancestorCollectionElement.getDataForThisElement();
      cachedData = ancestorData?.[name];
    }
  }

  if (!cachedData) {
    return maxLength;
  }

  const nodeData = !field ? cachedData : cachedData?.[field];
  if (!Array.isArray(nodeData)) {
    return maxLength;
  }

  return Math.min(nodeData.length, maxLength);
};

export const $syncCollectionElementNodesInCollection = (
  collectionNode: CollectionNode,
  child?: CollectionElementNode,
  options?: {
    exclude?: WPLexicalNode[];
    preserveElementsByCollectionKey?: Record<string, CollectionElementNode>;
  }
) => {
  const { exclude = [], preserveElementsByCollectionKey = {} } = options || {};
  const elementLength = $getCollectionElementLength(collectionNode);

  // If child is passed, then the number of children should be elementLength - 1
  const number = child ? elementLength - 1 : elementLength;

  let newChild = child
    ? child
    : collectionNode.getChildren().length > 0 &&
        $isCollectionElementNode(collectionNode.getChildren()[0])
      ? (collectionNode.getChildren()[0] as CollectionElementNode)
      : null;

  // Remove all existing children except the one that is passed as argument
  const children = collectionNode
    .getChildren()
    .filter((c) => c.getKey() !== child?.getKey());

  for (const child of children) {
    child.remove();
  }

  // Add new children
  for (let i = 0; i < number; i++) {
    const collectionElementNode = (
      newChild
        ? $deferredDeepCopy(newChild, { exclude })
        : $createCollectionElementNode()
    ) as CollectionElementNode;

    collectionNode.attach(collectionElementNode, {
      syncCollection: false,
    });
  }

  // Refresh data to update the template nodes

  collectionNode.refreshData();

  // After deep copy, nested CollectionNodes may have incorrect element counts
  // because they were cloned from a template whose data differs from each element's actual data.
  // Re-sync any nested CollectionNodes within each element to correct their element counts.
  for (const elementChild of collectionNode.getChildren()) {
    if ($isCollectionElementNode(elementChild)) {
      const nestedCollections: CollectionNode[] = [];
      $walkNode(elementChild, (node) => {
        if (
          $isCollectionNode(node) &&
          // Only collect CollectionNodes whose direct parent collection is ours,
          // not deeper nested ones — those will be handled recursively.
          node.getParents().find($isCollectionNode)?.getKey() ===
            collectionNode.getKey()
        ) {
          nestedCollections.push(node);
        }
      });

      for (const nestedCollection of nestedCollections) {
        // If a nested collection contains the edited node's element, preserve it
        // so we don't destroy the selected node during a parent sync.
        const preservedElement =
          preserveElementsByCollectionKey[nestedCollection.getKey()];
        if (
          preservedElement &&
          preservedElement.getParent()?.getKey() === nestedCollection.getKey()
        ) {
          $syncCollectionElementNodesInCollection(
            nestedCollection,
            preservedElement,
            {
              exclude,
              preserveElementsByCollectionKey,
            }
          );
        } else {
          $syncCollectionElementNodesInCollection(nestedCollection);
        }
      }
    }
  }
};

export const $getParentAsCollection = (
  node: LexicalNode
): [CollectionNode, CollectionElementNode] | [undefined, undefined] => {
  let collectionNode: CollectionNode | null = null;
  let collectionElementNode: CollectionElementNode | null = null;

  const parentNode = node.getParent();

  // Check if the parent node is a collection node or a collection element node, then sync collection element nodes
  if ($isCollectionNode(parentNode) || $isCollectionElementNode(parentNode)) {
    collectionNode = $isCollectionNode(parentNode)
      ? parentNode
      : (parentNode.getParent() as CollectionNode);

    collectionElementNode = $isCollectionElementNode(parentNode)
      ? parentNode
      : (parentNode
          .getChildren()
          .find($isCollectionElementNode) as CollectionElementNode);
  }

  if (
    !$isCollectionElementNode(collectionElementNode) ||
    !$isCollectionNode(collectionNode)
  ) {
    return [undefined, undefined];
  }

  return [collectionNode, collectionElementNode];
};

/**
 * Retrieves all parent collection nodes and their corresponding collection element nodes for a given node.
 *
 * @param node - The LexicalNode for which to find parent collection nodes and their collection element nodes.
 * @returns A tuple containing:
 *   - An array of CollectionNode objects representing the parent collection nodes.
 *   - A record where the keys are the parent collection node keys and the values are arrays of CollectionElementNode objects that are children of the corresponding collection node.
 */
export const $getParentCollections = (
  node: LexicalNode
): [CollectionNode[], Record<string, CollectionElementNode[]>] => {
  const collectionNodes: CollectionNode[] = [];
  let collectionElementNodes: Record<string, CollectionElementNode[]> = {};

  // Get all parent nodes of the given node
  const parentNodes: ElementNode[] = node.getParents();

  // Iterate over the parent nodes to find collection nodes
  for (const parentNode of parentNodes) {
    if ($isCollectionNode(parentNode)) {
      // If the parent node is a collection node, add it to the collectionNodes array
      collectionNodes.push(parentNode);

      // Get the key of the collection node
      const parentKey = parentNode.getKey();

      // Get the collection element nodes that are children of the collection node
      const collectionElementNodesArray = parentNode
        .getChildren()
        .filter($isCollectionElementNode)
        // Ensure that the collection element node is a child of the collection node by checking the parent key
        .filter((child) => parentNode?.getKey() == child.getParent()?.getKey());

      // Add the collection element nodes to the collectionElementNodes record
      collectionElementNodes = {
        ...collectionElementNodes,
        [parentKey]: collectionElementNodesArray,
      };
    }
  }

  return [collectionNodes, collectionElementNodes];
};

/**
 * Propagates changes from a modified node upward through the collection hierarchy.
 *
 * This is the complementary function to $syncCollectionElementNodesInCollection:
 * - $syncCollectionElementNodesInCollection: Operates on a SINGLE collection, syncing its children downward
 * - $syncParentCollections: Operates on a NODE, syncing ALL ancestor collections upward
 *
 * When a node within a CollectionElementNode is modified (added, removed, or changed), this function
 * ensures that the change propagates to all sibling CollectionElementNodes in the same collection,
 * and to any parent collections up the hierarchy (for nested collections).
 *
 * @param node - The modified node. Can be any LexicalNode, including the CollectionElementNode itself.
 * @returns true if parent collections were found and synced, false otherwise
 *
 * @example
 * // User adds a widget to the first element of a collection
 * const firstElement = collection.getChildren()[0] as CollectionElementNode;
 * firstElement.append(newWidget);
 * $syncParentCollections(newWidget);
 * // Result: newWidget is now cloned and appears in all other CollectionElementNodes
 *
 * @example
 * // User modifies a TemplateTextNode in one collection element
 * const templateNode = $getNodeByKey('template-key') as TemplateTextNode;
 * templateNode.setTemplate('${item.title}');
 * $syncParentCollections(templateNode);
 * // Result: All sibling TemplateTextNodes in other elements get the same template
 *
 * @example
 * // Nested collections: modify a node in inner collection
 * // Structure: OuterCollection > OuterElement > InnerCollection > InnerElement > Widget
 * const widget = $getNodeByKey('widget-key') as WidgetNode;
 * widget.setConfig(newConfig);
 * $syncParentCollections(widget);
 * // Result:
 * // 1. Widget change syncs to all InnerElements in InnerCollection
 * // 2. InnerCollection change syncs to all OuterElements in OuterCollection
 *
 * **Algorithm:**
 * 1. Find all ancestor CollectionNodes by traversing up the tree (via $getParentCollections)
 * 2. If no ancestor collections found, return false (node is not in a collection)
 * 3. Find all ancestor CollectionElementNodes (including the node itself if it's a CollectionElementNode)
 * 4. For each ancestor CollectionNode:
 *    a. Find the corresponding CollectionElementNode that contains the modified node
 *    b. Call $syncCollectionElementNodesInCollection(collectionNode, collectionElementNode)
 *       - This uses the modified element as template and regenerates all sibling elements
 * 5. Refresh data for all other collections in the tree that weren't in the ancestor chain
 *    - This ensures unrelated collections also see updated data if needed
 *
 * **Key Differences from $syncCollectionElementNodesInCollection:**
 *
 * | Aspect | $syncCollectionElementNodesInCollection | $syncParentCollections |
 * |--------|----------------------------------------|------------------------|
 * | Direction | Downward (collection → elements) | Upward (node → ancestors) |
 * | Input | CollectionNode | Any LexicalNode |
 * | Scope | Single collection | All ancestor collections |
 * | Use Case | Initialize/reset a collection | Propagate changes from a node |
 * | When Called | Creating collection, changing elementMaxLength | Modifying nodes within collections |
 * | Template Source | First element or provided child | Element containing the modified node |
 *
 * **When to call this function:**
 * - After adding a node to a CollectionElementNode (e.g., insertAfter, insertBefore, append)
 * - After removing a node from a CollectionElementNode
 * - After modifying a node's properties within a collection (e.g., widget config, template text)
 * - When you want changes in one collection element to propagate to all siblings
 * - This is typically called automatically by WPElementNode and WPDecoratorNode lifecycle methods
 *
 * **Important Notes:**
 * - This function internally calls $syncCollectionElementNodesInCollection for each ancestor
 * - For nested collections, syncs happen from innermost to outermost
 * - The modified element becomes the template for regenerating siblings
 * - Unrelated collections in the tree get refreshData() to ensure consistency
 */
export const $syncParentCollections = (node: LexicalNode) => {
  const preserveElementsByCollectionKey: Record<string, CollectionElementNode> =
    {};
  // Build a map of collectionKey -> collectionElement that contains the edited node.
  // This lets nested re-sync keep the element (and its children) intact.
  let lastCollectionElement: CollectionElementNode | null = null;
  if ($isCollectionElementNode(node)) {
    lastCollectionElement = node;
  }
  for (const parentNode of node.getParents()) {
    if ($isCollectionElementNode(parentNode)) {
      lastCollectionElement = parentNode;
      continue;
    }
    if (
      $isCollectionNode(parentNode) &&
      lastCollectionElement &&
      lastCollectionElement.getParent()?.getKey() === parentNode.getKey()
    ) {
      preserveElementsByCollectionKey[parentNode.getKey()] =
        lastCollectionElement;
    }
  }

  // Get all parent collection nodes
  const [collectionNodes] = $getParentCollections(node);

  if (collectionNodes.length <= 0) {
    return false;
  }

  // Get the closest collection element node
  const parentCollectionElementNodes = node
    .getParents()
    .filter($isCollectionElementNode);

  // node can be a collection element node. When so, push it to the parentCollectionElementNodes
  if ($isCollectionElementNode(node)) {
    parentCollectionElementNodes.push(node);
  }

  // Sync collection element nodes in collection node
  // Iterate over the collection nodes and sync the collection element nodes
  for (let collectionNode of collectionNodes) {
    const collectionNodeKey = collectionNode.getKey();

    // Get the parent collection element node to sync with other collection element nodes in the same collection node
    const parentCollectionElementNode = parentCollectionElementNodes.find(
      (node) => node.getParent()?.getKey() === collectionNodeKey
    );

    // Should not happen but just in case
    if (!parentCollectionElementNode) {
      logger.log("No parent collection element node found", collectionNode);
      return false;
    }

    $syncCollectionElementNodesInCollection(
      collectionNode,
      parentCollectionElementNode,
      {
        preserveElementsByCollectionKey,
      }
    );
  }

  // There might be collection nodes that are not in the parent collection nodes,
  // meaning that they are not in the hierarchy of the node so we need to refresh data for those nodes
  const collectionNodeKeys = collectionNodes.map((node) => node.getKey());
  $walkNode($getRoot(), (node) => {
    if (
      $isCollectionNode(node) &&
      !collectionNodeKeys.includes(node.getKey())
    ) {
      $syncCollectionElementNodesInCollection(node);
    }
  });

  return true;
};

/**
 * Broadcasts synchronization changes from a collection node both downward and upward in the hierarchy.
 *
 * This performs a two-way sync:
 * 1. Downward: Regenerates all collection element nodes within the given collection based on its computed element length
 * 2. Upward: Propagates changes to all ancestor collections in the hierarchy
 *
 * Use this when modifying a collection's structure or content that should cascade
 * to both its children and affect parent collections (e.g., changing element length, updating templates).
 *
 * @param collectionNode - The collection node to sync from
 */
export const $syncCollectionBroadcast = (collectionNode: CollectionNode) => {
  $syncCollectionElementNodesInCollection(collectionNode);
  $syncParentCollections(collectionNode);
};

// export const $syncTemplateTextNodesInCollection = (node: TemplateTextNode) => {
//   // Check and sync parent CollectionElementNode if exists
//   // Note: Text Node doesn't contain children, so we need to traverse up to find the parent
//   const parentCollectionElement = $findParentCollectionElementNode(node);
//   if (!parentCollectionElement) {
//     return;
//   }

//   // Get css editor class name of TemplateTextNode to identify other TemplateTextNodes in the same collection
//   const cssEditorClassName = node.__css.getEditorClassName();

//   // Now get the collection node
//   const collectionNode = parentCollectionElement.getParent();
//   if (!$isCollectionNode(collectionNode)) {
//     // Should not happen but just in case
//     return;
//   }

//   // Get the template value to sync
//   const templateContent = node.__template;

//   const childrenOfCollection = collectionNode.getChildren();

//   // Walk through all children of the collection node
//   for (const child of childrenOfCollection) {
//     // Skip if the child is not a CollectionElementNode or if it's the same as the parentCollectionElement
//     if (
//       !$isCollectionElementNode(child) ||
//       child.getKey() === parentCollectionElement.getKey()
//     ) {
//       continue;
//     }

//     // Now find the TemplateTextNode within this CollectionElementNode
//     const templateTextNode = child
//       .getChildren()
//       .find(
//         (childOfChild) =>
//           $isTemplateTextNode(childOfChild) &&
//           childOfChild.__css.getEditorClassName() === cssEditorClassName
//       ) as TemplateTextNode | undefined;

//     if (templateTextNode) {
//       const writableTemplateTextNode = templateTextNode.getWritable();
//       // Update the template content
//       writableTemplateTextNode.setTemplate(templateContent);
//       // Then parse and load the text content
//       writableTemplateTextNode.loadText();
//     }
//   }
// };

export const $checkNodeAndSyncCollectionElementNodesInCollection = (
  node: WPLexicalNode,
  options?: { remove: boolean }
) => {
  const { remove = false } = options ?? {};
  // Check if the template node is within a collection element node
  // If so, load the template via the collection node
  const collectionNode = $isCollectionNode(node)
    ? node
    : node.getParents().find($isCollectionNode);

  const collectionElementNode = $isCollectionElementNode(node)
    ? node
    : node.getParents().find($isCollectionElementNode);

  if (collectionNode && collectionElementNode) {
    // Sync collection element nodes in collection node
    $syncCollectionElementNodesInCollection(
      collectionNode,
      collectionElementNode,
      {
        exclude: remove ? [node] : undefined,
      }
    );
    collectionNode.refreshData();
    return true;
  }

  return false;
};

export const $insertNodeToCollection = (
  collectionNode: CollectionNode,
  klassNode: Klass<LexicalNode>,
  args: any[],
  refName: string
) => {
  // Get collection element nodes
  const collectionElementNodes = collectionNode
    .getChildren()
    .filter($isCollectionElementNode);

  // Iterate over the collection element nodes and set the text node
  for (const collectionElementNode of collectionElementNodes) {
    const newNode = $deferredCreateNode(klassNode, args); //klassNode.clone(childNode);
    (newNode as any).__refName = refName;
    collectionElementNode.append(newNode);
  }
};

export const $removeChildNodesFromCollection = (
  collectionNode: CollectionNode,
  refName: string,
  editor: LexicalEditor
) => {
  editor.update(
    () => {
      // Get collection element nodes
      const collectionElementNodes = collectionNode
        .getChildren()
        .filter($isCollectionElementNode);

      // Iterate over the collection element nodes and remove the text node
      for (const collectionElementNode of collectionElementNodes) {
        const textNodes = collectionElementNode
          .getChildren()
          .filter($isTextNode);
        for (const textNode of textNodes) {
          if ((textNode as any).__refName === refName) {
            textNode.remove();
          }
        }
      }
    },
    { discrete: true }
  );
};

export const $getCollectionNames = (): string[] => {
  const collectionNames: string[] = [];

  walkNodeWithWidgets($getEditor(), (nestedEditor, node) => {
    nestedEditor.read(() => {
      if ($isCollectionNode(node)) {
        collectionNames.push(node.getName());
      }
    });
  });

  return collectionNames;
};

/**
 * Finds the DataFetchingNode associated with a given CollectionNode within a single editor instance.
 *
 * How it works:
 * 1. Extracts the data name from the CollectionNode (via getDataName())
 * 2. Walks the entire editor tree from root
 * 3. Finds the first DataFetchingNode whose name matches the CollectionNode's data name
 *
 * Note: This only searches within the current editor scope - it does NOT traverse into nested
 * widget editors. Use findDataFetchingNodeByCollectionName() for cross-widget searches.
 *
 * @param collectionNode - The CollectionNode to find the associated DataFetchingNode for
 * @returns The linked DataFetchingNode if found, or null if not found or collectionNode is null/undefined
 */
export const $findDataFetchingNodeByCollectionNode = (
  collectionNode: CollectionNode | null | undefined
): DataFetchingNode | null => {
  if (!collectionNode) {
    return null;
  }

  const dataNodeName = collectionNode.getDataName();

  // Now find data fetching node by data name
  let dataFetchingNode: DataFetchingNode | undefined = undefined;

  $walkNode($getRoot(), (node) => {
    if ($isDataFetchingNode(node) && node.getName() === dataNodeName) {
      dataFetchingNode = node;
    }
  });

  return dataFetchingNode as unknown as DataFetchingNode | null;
};

export const findCollectionByName = (
  editor: LexicalEditor,
  collectionName: string
): [CollectionNode, LexicalEditor] | null => {
  let foundCollection: CollectionNode | null = null;
  let currentEditor = editor;

  deferredWalkNodeWithWidgets(editor, (editor, node, options) => {
    if (foundCollection) return;

    editor.read(() => {
      if ($isCollectionNode(node) && node.getName() === collectionName) {
        foundCollection = node;
        currentEditor = editor;
      }
    });
  });

  return foundCollection
    ? [foundCollection satisfies CollectionNode, currentEditor]
    : null;
};

/**
 * Finds the DataFetchingNode linked to a CollectionNode with the specified name.
 * Searches recursively through the editor tree, including nodes nested within widgets.
 *
 * @param editor - The root LexicalEditor instance to search from
 * @param collectionName - The name of the collection to find
 * @returns A tuple of [DataFetchingNode, LexicalEditor] if found, or null if not found.
 *          The returned editor instance is where the node was found (may differ from root if inside a widget).
 */
export const findDataFetchingNodeByCollectionName = (
  editor: LexicalEditor,
  collectionName: string
): [DataFetchingNode, LexicalEditor] | null => {
  let found = false;
  let currentEditor = editor;
  let dataFetchingNode: DataFetchingNode | null = null;

  deferredWalkNodeWithWidgets(editor, (editor, node, options) => {
    if (found) return;

    currentEditor = editor;
    currentEditor.read(() => {
      if ($isCollectionNode(node) && node.getName() === collectionName) {
        // Then check if collection node has data name
        dataFetchingNode = $findDataFetchingNodeByCollectionNode(node);
        if (dataFetchingNode) {
          found = true;
        }
      }
    });
  });

  return dataFetchingNode
    ? [dataFetchingNode satisfies DataFetchingNode | null, currentEditor]
    : null;
};
