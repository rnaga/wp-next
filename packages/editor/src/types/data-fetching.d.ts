import { LexicalEditor } from "lexical";
import { CollectionNode } from "../lexical/nodes/collection/CollectionNode";
import { DataFetchingPagination } from "../lexical/nodes/data-fetching/DataFetchingNode";

export type DynamicAttributeReloadEntry = {
  // Data fetching node names referenced by the conditions of this node
  dataKeys: string[];
  attributes: {
    // Class names to add — only from matched rules
    classNames: string[];
    // All class names across every rule — used to remove stale values
    allPossibleClassNames: string[];
    // Custom attributes to set — only from matched rules
    customAttributes: Record<string, string>;
    // All custom attribute keys across every rule — used to remove stale values
    allPossibleCustomAttributeKeys: string[];
    // Whether the element should be visible (false means display:none)
    display: boolean;
  };
};

export type TemplateTextReloadEntry = {
  // Data fetching node names referenced in the template string
  dataKeys: string[];
  // Processed template content with dynamic expressions resolved
  content: string;
};

/**
 * Represents a CollectionNode whose full inner HTML should be regenerated.
 * Keyed by CSS class name in CollectionMap.
 */
export type CollectionReloadEntry = {
  collectionNode: CollectionNode;
  collectionEditor: LexicalEditor;
};

export type DynamicAttributeMap = Record<string, DynamicAttributeReloadEntry>;
export type TemplateTextMap = Record<string, TemplateTextReloadEntry>;
export type CollectionMap = Record<string, CollectionReloadEntry>;

export type ReloadMap = {
  // Dynamic attribute nodes keyed by CSS class name
  dynamicAttributes: DynamicAttributeMap;
  // Template text nodes keyed by CSS class name
  templateText: TemplateTextMap;
  // Collection nodes to fully regenerate, keyed by CSS class name
  collections: CollectionMap;
};

/**
 * A single node entry in the DynamicValuesReloadedPayload nodes map.
 * Consolidates dynamic attribute and template text reload data for a node,
 * keyed by its CSS class name.
 */
export type DynamicValuesReloadedEntry = {
  // Data fetching node names referenced by this node
  dataNames: string[];
  // Dynamic attribute reload data, if this node has dynamic attributes
  attributes: DynamicAttributeReloadEntry | undefined;
  // Template text reload data, if this node is a template text node
  templateText: TemplateTextReloadEntry | undefined;
};

/**
 * Payload for RELOAD_DYNAMIC_VALUE_COMMAND.
 * Carries the full context of a reloadDynamicValues call: what data was fetched,
 * what query triggered it, and which DOM nodes were patched.
 */
export type DynamicValuesReloadedPayload = {
  // Name of the data fetching node that triggered the reload, if applicable
  dataFetchingName?: string;
  // Name of the collection that was updated, if applicable
  targetCollection?: string;

  // Optional unique ID of the React component (e.g. a ReactDecorator such as Pagination)
  // that initiated this reload. Generated via useId() in the caller and passed through
  // reloadDynamicValues. Listeners can compare this against their own ID to determine
  // whether they triggered the reload and skip redundant logic accordingly.
  dataFetchingId?: string;

  // Query used when fetching data
  query: Record<string, any>;
  // Fetched data: [data, pagination] when pagination applies, [data] otherwise
  fetchedData?: [any, DataFetchingPagination] | [any];
  // Nodes that were patched in the DOM, keyed by CSS class name
  nodes: Record<string, DynamicValuesReloadedEntry>;
};
