import { z } from "zod";
import { $getRoot } from "lexical";

import {
  $getDataKlassNodeByType,
  $isDataFetchingNode,
} from "./DataFetchingNode";

import type { KeyWithType } from "../../dynamic-attributes/types";
import { EXCLUDED_DATA_KEYS } from "./constants";
import {
  $isCollectionNode,
  CollectionNode,
} from "../collection/CollectionNode";
import type { WPLexicalNode } from "../wp/types";

/**
 * Determine the simplified type of a Zod schema
 */
type AnyZodSchema = z.ZodTypeAny | z.core.$ZodType;

const getZodType = (schema: AnyZodSchema): KeyWithType["zodType"] => {
  // Unwrap nullable/optional first
  let unwrapped = schema;
  if (
    unwrapped instanceof z.ZodNullable ||
    unwrapped instanceof z.ZodOptional
  ) {
    unwrapped = unwrapped.unwrap();
  }

  if (unwrapped instanceof z.ZodString) return "string";
  if (unwrapped instanceof z.ZodNumber) return "number";
  if (unwrapped instanceof z.ZodDate) return "date";
  if (unwrapped instanceof z.ZodBoolean) return "boolean";
  if (unwrapped instanceof z.ZodArray) return "array";
  if (unwrapped instanceof z.ZodObject) return "object";

  return "unknown";
};

/**
 * Get the keys of a Zod schema WITH their types
 *
 * @param schema - Zod schema
 * @param options - Options for filtering
 * @returns Array of { key, zodType }
 */
export const getKeysWithTypes = <T extends AnyZodSchema>(
  schema: T,
  options?: { subKey?: string }
): KeyWithType[] => {
  if (schema === null || schema === undefined) {
    return [];
  }

  // Handle subKey drilling
  if (options?.subKey) {
    if (schema instanceof z.ZodObject && schema.shape[options.subKey]) {
      const subSchema = schema.shape[options.subKey];
      return getKeysWithTypes(subSchema);
    }
    return [];
  }

  // Unwrap nullable/optional
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
    return getKeysWithTypes(schema.unwrap() as AnyZodSchema, options);
  }

  // Handle object schemas
  if (schema instanceof z.ZodObject) {
    const entries = Object.entries(schema.shape);

    return entries.map(([key, value]) => {
      const zodType = getZodType(value as AnyZodSchema);
      return { key, zodType };
    });
  }

  // Handle ZodArray
  if (schema instanceof z.ZodArray) {
    return getKeysWithTypes(schema.element as AnyZodSchema, options);
  }

  return [];
};

export const dataKeysExist = (node?: WPLexicalNode) => {
  return getAllKeysWithTypes(node).length > 0;
};

/**
 * Find the CollectionNode that references the given DataFetchingNode name
 * by walking up the parent chain of the provided node.
 */
const $findCollectionNodeForDataNode = (
  node: WPLexicalNode | undefined,
  dataNodeName: string
): CollectionNode | null => {
  if (!node) return null;

  const parents = node.getParents();
  for (const parent of parents) {
    if ($isCollectionNode(parent)) {
      const dataName = parent.getDataName();
      // The collection's dataName may be just the name (e.g. "posts")
      // or name.field (e.g. "posts.items")
      const [name] = dataName.split(".");
      if (name === dataNodeName || dataName === dataNodeName) {
        return parent;
      }
    }
  }

  return null;
};

/**
 * Append pagination keys (e.g. `${%pagination.posts.page}`) to keysWithTypes.
 * Extracted to avoid duplicating this logic for both array and object validators.
 */
const pushPaginationKeys = (
  keysWithTypes: KeyWithType[],
  klassNode: ReturnType<typeof $getDataKlassNodeByType>,
  nodeName: string
) => {
  const paginationValidator = klassNode!.getPaginationValidator();
  const paginationKeys = getKeysWithTypes(paginationValidator);
  paginationKeys.forEach(({ key, zodType }) => {
    keysWithTypes.push({
      key: `\${%pagination.${nodeName}.${key}}`,
      zodType,
    });
  });
};

/**
 * Get all keys with types from all DataFetchingNodes in the editor
 *
 * @param node - Optional WPLexicalNode to resolve dynamic itemName from parent CollectionNode.
 *               When provided and inside a collection, uses the CollectionNode's __itemName
 *               instead of the hardcoded "item" prefix for array data keys.
 * @returns Array of { key, zodType } with full path (e.g., "posts.title")
 */
export const getAllKeysWithTypes = (node?: WPLexicalNode): KeyWithType[] => {
  const keysWithTypes: KeyWithType[] = [];

  const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);

  dataNodes.forEach((dataNode) => {
    const klassNode = $getDataKlassNodeByType(dataNode.getType());
    if (!klassNode || EXCLUDED_DATA_KEYS.includes(klassNode.getType())) {
      return;
    }

    const validator = klassNode.getValidator();
    const nodeName = dataNode.getName();

    // Handle array validators
    if (validator instanceof z.ZodArray) {
      // Resolve the itemName from the parent CollectionNode if a node context is provided
      const collectionNode = $findCollectionNodeForDataNode(node, nodeName);
      const itemName = collectionNode?.getItemName() ?? "item";

      const elementKeys = getKeysWithTypes(validator.element as AnyZodSchema);
      elementKeys.forEach(({ key, zodType }) => {
        keysWithTypes.push({
          key: `\${${itemName}.${key}}`,
          zodType,
        });
      });

      if (dataNode.__hasPagination) {
        pushPaginationKeys(keysWithTypes, klassNode, nodeName);
      }

      return;
    }

    // Handle object validators
    if (validator instanceof z.ZodObject) {
      const keys = getKeysWithTypes(validator);
      keys.forEach(({ key, zodType }) => {
        keysWithTypes.push({
          key: `\${${nodeName}.${key}}`,
          zodType,
        });
      });
    }

    if (dataNode.__hasPagination) {
      pushPaginationKeys(keysWithTypes, klassNode, nodeName);
    }
  });

  return keysWithTypes;
};
