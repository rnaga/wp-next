import { $getRoot, Klass, LexicalEditor } from "lexical";
import { z } from "zod";
import {
  $getDataKlassNodeByType,
  $getDataFetchingNodeByName,
  $isDataFetchingNode,
} from "./DataFetchingNode";
import { WPLexicalNode } from "../wp";
import {
  $isCollectionNode,
  CollectionNode,
} from "../collection/CollectionNode";
import { EXCLUDED_DATA_KEYS } from "./constants";

// const validatorNodeTypeMapping: Record<string, ZodTypeAny> = {};

// export const registerDataFetchingNodeValidator = <T extends typeof DataFetchingNode>(
//   klassNode: T
// ) => {
//   validatorNodeTypeMapping[klassNode.getType()] = klassNode.getValidator();
// };

export const getDataType = (
  editor: LexicalEditor,
  dataName: string
): Promise<"array" | "object" | "unknown"> =>
  new Promise((resolve) => {
    editor.read(() => {});
    const node = $getDataFetchingNodeByName(dataName);
    const data = node?.getData();

    if (Array.isArray(data)) {
      resolve("array");
    }

    if (typeof data === "object" && data !== null) {
      resolve("object");
    }

    resolve("unknown");
  });

/**
 * Get the keys of a Zod schema
 *
 * @param schema
 * @param options
 * @returns string[]
 */
type AnyZodSchema = z.ZodTypeAny | z.core.$ZodType;

export const getKeys = <T extends AnyZodSchema>(
  schema: T,
  options?: { arraysOnly?: boolean; subKey?: string }
): string[] => {
  // Ensure schema is not null or undefined
  if (schema === null || schema === undefined) {
    return [];
  }

  // If subKey is provided, drill down to that specific sub-schema first
  if (options?.subKey) {
    if (schema instanceof z.ZodObject && schema.shape[options.subKey]) {
      const subSchema = schema.shape[options.subKey];
      return getKeys(subSchema, { arraysOnly: false }); // Process the sub-schema
    } else {
      return []; // Return an empty array if subKey is not found
    }
  }

  // Handle nullable or optional schemas by unwrapping them
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
    return getKeys(schema.unwrap() as AnyZodSchema, options);
  }

  // Handle object schemas
  if (schema instanceof z.ZodObject) {
    const entries = Object.entries(schema.shape);

    return entries.flatMap(([key, value]) => {
      // Unwrap the value if it's nullable or optional
      let unwrappedValue = value;
      if (
        unwrappedValue instanceof z.ZodNullable ||
        unwrappedValue instanceof z.ZodOptional
      ) {
        unwrappedValue = unwrappedValue.unwrap();
      }

      // Check if the unwrapped value is a ZodArray
      if (unwrappedValue instanceof z.ZodArray) {
        return options?.arraysOnly ? [key] : [];
      }

      // If arraysOnly is not set, return top-level keys only
      if (!options?.arraysOnly) {
        return [key];
      }

      return [];
    });
  }

  // Handle ZodArray types if not already handled
  if (schema instanceof z.ZodArray) {
    return getKeys(schema.element as AnyZodSchema, options);
  }

  // Return empty array for all other types
  return [];
};

export const getAllArrayKeysFromDataFetchingNodes = (
  editor: LexicalEditor,
  options?: {
    targetNodeNames?: string[];
    excludeNodeTypes?: string[];
    getNestedArrays?: boolean;
  }
): string[] => {
  const {
    targetNodeNames,
    excludeNodeTypes = [],
    getNestedArrays = true,
  } = options || {};
  const arrayKeys: string[] = [];

  return editor.read(() => {
    const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);

    dataNodes.forEach((node) => {
      const klassNode = $getDataKlassNodeByType(node.getType());

      if (
        !klassNode ||
        excludeNodeTypes.includes(node.getType()) ||
        EXCLUDED_DATA_KEYS.includes(node.getType())
      ) {
        return;
      }

      const validator = klassNode.getValidator();

      if (targetNodeNames && !targetNodeNames.includes(node.getName())) {
        return;
      }

      if (validator instanceof z.ZodArray) {
        arrayKeys.push(node.getName());
        return;
      }

      // Skip if getNestedArrays is false
      if (!getNestedArrays) {
        return;
      }

      const keys = getKeys(validator, { arraysOnly: true });
      if (keys.length) {
        const subKeys = keys.map((key) => `${node.getName()}.${key}`);
        arrayKeys.push(...subKeys);
      }
    });

    return arrayKeys;
  });
};

export const getArrayKeysInArray = (
  editor: LexicalEditor,
  nameKey: `${string}.${string}` | string
): string[] => {
  const [name, key = ""] = nameKey.split(".");

  const objectKeys: string[] = [];
  return editor.read(() => {
    const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);
    dataNodes.forEach((node) => {
      const klassNode = $getDataKlassNodeByType(node.getType());
      if (!klassNode) {
        return;
      }

      // const node = $createDataFetchingNode(klassNode, {});
      let validator = klassNode.getValidator();

      if (node.getName() !== name) {
        return;
      }

      if (key.length > 0) {
        // Unwrap top-level ZodArray to access inner object shape
        let schemaForShape: any = validator;
        if (schemaForShape instanceof z.ZodArray) {
          schemaForShape = schemaForShape.element;
        }
        if (
          schemaForShape instanceof z.ZodOptional ||
          schemaForShape instanceof z.ZodNullable
        ) {
          schemaForShape = schemaForShape.unwrap();
        }
        validator = schemaForShape?.shape?.[key];
      }

      const keys = getKeys(validator, { arraysOnly: true });
      if (keys.length) {
        const subKeys = keys.map(
          (subKey) =>
            `${node.getName()}${key.length > 0 ? "." + key : ""}.${subKey}`
        );
        objectKeys.push(...subKeys);
      }
    });

    return objectKeys;
  });
};

export const getObjectKeysInArray = (
  editor: LexicalEditor,
  nameKey: `${string}.${string}` | string
): string[] => {
  const [name, key = ""] = nameKey.split(".");

  const objectKeys: string[] = [];
  return editor.read(() => {
    const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);
    dataNodes.forEach((node) => {
      const klassNode = $getDataKlassNodeByType(node.getType());
      if (!klassNode) {
        return;
      }

      // const node = $createDataFetchingNode(klassNode, {});
      let validator = klassNode.getValidator();

      if (node.getName() !== name) {
        return;
      }

      if (key.length > 0) {
        // Unwrap top-level ZodArray to access inner object shape
        let schemaForShape: any = validator;
        if (schemaForShape instanceof z.ZodArray) {
          schemaForShape = schemaForShape.element;
        }
        if (
          schemaForShape instanceof z.ZodOptional ||
          schemaForShape instanceof z.ZodNullable
        ) {
          schemaForShape = schemaForShape.unwrap();
        }
        validator = schemaForShape?.shape?.[key];
      }

      const keys = getKeys(validator, { arraysOnly: false });
      if (keys.length) {
        const subKeys = keys.map(
          (subKey) =>
            `${node.getName()}${key.length > 0 ? "." + key : ""}.${subKey}`
        );
        objectKeys.push(...subKeys);
      }
    });

    return objectKeys;
  });
};

export const getPaginationKeys = (editor: LexicalEditor): string[] => {
  return editor.read(() => {
    const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);
    const keys: string[] = [];
    dataNodes.forEach((node) => {
      if (!node.__hasPagination) return;
      const name = node.getName();
      keys.push(
        `%pagination.${name}.page`,
        `%pagination.${name}.limit`,
        `%pagination.${name}.totalPage`,
        `%pagination.${name}.count`
      );
    });
    return keys;
  });
};

export const getAllObjectKeys = (editor: LexicalEditor): string[] => {
  const objectKeys: string[] = [];

  return editor.read(() => {
    const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);
    dataNodes.forEach((node) => {
      const nodeType = node.getType();
      const klassNode = $getDataKlassNodeByType(node.getType());
      if (!klassNode) {
        return;
      }
      const validator = klassNode.getValidator();

      if (validator instanceof z.ZodObject) {
        const keys = getKeys(validator, { arraysOnly: false });
        if (keys.length) {
          const subKeys = keys.map((key) => `${node.getName()}.${key}`);
          objectKeys.push(...subKeys);
        }
      }
    });

    return objectKeys;
  });
};

/**
 * Resolves a nested collection's data name by tracing through the parent collection chain.
 *
 * When a CollectionNode has a dataName like "items.categories", "items" may refer to
 * a parent CollectionNode's itemName rather than a root DataFetchingNode name.
 * This function resolves it to the actual DataFetchingNode path (e.g. "posts.categories").
 */
const $resolveNestedCollectionDataName = (
  node: WPLexicalNode,
  dataName: string
): string => {
  const [firstPart, ...rest] = dataName.split(".");

  // Walk up the parent chain to find a CollectionNode whose itemName matches firstPart
  const parentCollections = node
    .getParents()
    .filter($isCollectionNode) as CollectionNode[];

  // Skip index 0 (the immediate parent collection whose dataName we're resolving)
  for (let i = 1; i < parentCollections.length; i++) {
    const parent = parentCollections[i];
    if (parent.getItemName() === firstPart) {
      const parentDataName = parent.getDataName();
      if (parentDataName && rest.length > 0) {
        return `${parentDataName}.${rest.join(".")}`;
      } else if (parentDataName) {
        return parentDataName;
      }
    }
  }

  return dataName;
};

export const $getArrayDataFileKeys = (
  editor: LexicalEditor,
  node: WPLexicalNode
): string[] => {
  const parentCollectionNode = node.getParents().find($isCollectionNode);
  const collectionDataName = parentCollectionNode?.getDataName();
  const collectionItemName = parentCollectionNode?.getItemName();

  if (!collectionDataName) {
    return [];
  }

  let arrayDataFileKeys: string[] = [];

  // When the node is a child of a collection node, get the data name of the collection node
  if (collectionDataName) {
    // Resolve nested collection data names (e.g. "items.categories" -> "posts.categories")
    const resolvedDataName = $resolveNestedCollectionDataName(
      node,
      collectionDataName
    );
    arrayDataFileKeys = getArrayKeysInArray(editor, resolvedDataName);

    // e.g. newDataFileKeys: [' posts.tags.term_id', ' posts.tags.name', ' posts.tags.slug']
    // Need to replace resolvedDataName prefix with collectionItemName
    if (collectionItemName) {
      arrayDataFileKeys = arrayDataFileKeys.map((key) => {
        // Remove resolvedDataName prefix
        let modifiedKey = key;
        if (key.startsWith(resolvedDataName)) {
          modifiedKey = key.slice(resolvedDataName.length).trim();
        }
        // Prefix with collectionItemName
        return `${collectionItemName}${modifiedKey}`;
      });
    }
  }

  arrayDataFileKeys = [
    ...arrayDataFileKeys,
    // Get all associated array data file keys set in the editor
    ...getAllArrayKeysFromDataFetchingNodes(editor, {
      getNestedArrays: true,
    }),
  ];

  return arrayDataFileKeys;
};

export const $getDataFileKeys = (
  editor: LexicalEditor,
  node: WPLexicalNode
): string[] => {
  const parentCollectionNode = node.getParents().find($isCollectionNode);
  const collectionDataName = parentCollectionNode?.getDataName();
  const collectionItemName = parentCollectionNode?.getItemName();

  let dataFileKeys: string[] = [];

  // When the node is a child of a collection node, get the data name of the collection node
  if (collectionDataName) {
    // Resolve nested collection data names (e.g. "items.categories" -> "posts.categories")
    const resolvedDataName = $resolveNestedCollectionDataName(
      node,
      collectionDataName
    );
    dataFileKeys = getObjectKeysInArray(editor, resolvedDataName);

    // e.g. newDataFileKeys: [' posts.tags.term_id', ' posts.tags.name', ' posts.tags.slug']
    // Need to replace resolvedDataName prefix with collectionItemName
    if (collectionItemName) {
      dataFileKeys = dataFileKeys.map((key) => {
        // Remove resolvedDataName prefix
        let modifiedKey = key;
        if (key.startsWith(resolvedDataName)) {
          modifiedKey = key.slice(resolvedDataName.length).trim();
        }
        // Prefix with collectionItemName
        return `${collectionItemName}${modifiedKey}`;
      });
    }
  }

  dataFileKeys = [
    ...dataFileKeys,
    // Get all associated data file keys set in the editor
    ...getAllObjectKeys(editor),
  ];

  return dataFileKeys;
};
