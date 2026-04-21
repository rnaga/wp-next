import { $getRoot, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";
import { z } from "zod";

import { $walkNode } from "../../walk-node";
import * as actionsCSSVariables from "../../../server/actions/css-variables";
import { getEditorServerActionsUtils } from "../../../server/actions/get-editor-server-actions-utils";
import { syncCSSFont } from "../../styles/font-sync";
import { $isFontUsedByNode } from "../../styles/font-usage";
import {
  cssCustomProperty,
  cssVariablesToString,
} from "../../styles/css-variables";
import {
  $storeFetchedData,
  DataFetchingNode,
  fetchDataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { addCustomFont, removeCustomFont } from "../font/CustomFontNode";
import {
  $addGoogleFont,
  $removeGoogleFontIfNotUsed,
} from "../font/GoogleFontNode";
import { $isWPLexicalNode } from "../wp/guards";
import type { WPLexicalNode } from "../wp/types";
import {
  NODE_CSS_VARIABLES_DATA_UPDATED_COMMAND,
  NODE_CSS_VARIABLES_FETCHED_COMMAND,
  NODE_CSS_VARIABLES_USAGE_REMOVED_COMMAND,
  NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND,
} from "./commands";
import {
  cssVariablesContentValidator,
  cssVariablesDataFetchingValidator,
  cssVariablesListValidator,
} from "./css-variables-validator";

import type * as types from "../../../types";
import { STYLE_DEVICES } from "../../styles-core/constants";
import { $updateCSS } from "../../styles-core/css";
import { KEY_Of_CSS_VARIABLES_USAGE_ARRAY } from "./constants";
import { $getCSSVariableUsage } from "./css-variables-access";

import { CSS_VARIABLES_OBJECT_KEYS } from "../../styles-core/constants";
import { logger } from "../../logger";

type Data = {
  cssVariablesList: z.infer<typeof cssVariablesListValidator>;
  css: string;
};

export const getCSSVariablesUsageObjectKey = (keyOfUsage: string) => {
  const prefix = CSS_VARIABLES_OBJECT_KEYS.find((prefix) =>
    keyOfUsage.startsWith(`${prefix}-`)
  );
  return prefix;
};

export const cssVariableUsageKeyType = (
  keyOfUsage: string
): "array" | "single" | "object" => {
  if (KEY_Of_CSS_VARIABLES_USAGE_ARRAY.includes(keyOfUsage)) {
    return "array";
  }

  if (
    CSS_VARIABLES_OBJECT_KEYS.some((prefix) => keyOfUsage.startsWith(prefix))
  ) {
    return "object";
  }

  return "single";
};

const hasCSSVariableWithSlug = (
  cssVariables: types.CSSVariablesUsage | types.KeyOfCSSVariablesUsageArray,
  slug: string
): boolean => {
  return Object.values(cssVariables).some((item) => {
    if (Array.isArray(item)) {
      return item.some((subItem) => subItem.slug === slug);
    }

    return item?.slug === slug;
  });
};

/**
 * Retrieves the CSS variable usage from a node, filtering out any inherited values.
 * Inherited values (where `inherit: true`) are excluded from the result.
 */
const getFilteredCSSVariableUsage = (
  editor: LexicalEditor,
  node: WPLexicalNode
): types.CSSVariablesUsageMixed => {
  const rawCSSVariableUsage: types.CSSVariablesUsageMixed =
    editor.read(() => node.getLatest().__css.get().__cssVariablesUsage) ?? {};

  const cssVariableUsage: types.CSSVariablesUsageMixed = {};
  for (const key in rawCSSVariableUsage) {
    const usageValue = rawCSSVariableUsage[key];
    if (Array.isArray(usageValue)) {
      cssVariableUsage[key] = usageValue.filter(
        (item) => item.inherit !== true
      );
    } else if (usageValue && usageValue.inherit !== true) {
      cssVariableUsage[key] = usageValue;
    }
  }
  return cssVariableUsage;
};

export class CSSVariablesNode extends DataFetchingNode<
  {
    // This is slug (post_name) in WpPost
    slugs: string[];
  },
  Data
> {
  // Custom Font can't be editable from left panel
  __hidden: boolean = true;

  static getValidator() {
    return cssVariablesDataFetchingValidator;
  }

  setName(name: string): void {
    // The value of name is static
    // since there's only one custom font node in the editor
    super.setName("css-variables-data-fetching");
  }

  setQuery(query: { slugs: string[] }) {
    // Remove duplicates from IDs
    this.__query = { slugs: Array.from(new Set(query.slugs)) };
  }

  static getType(): string {
    return "cssvariables-data";
  }

  static clone(node: CSSVariablesNode): CSSVariablesNode {
    const newNode = new CSSVariablesNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): CSSVariablesNode {
    const node = $createCSSVariablesNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  async fetch(serverActions: types.DataServerActions): Promise<
    [
      {
        cssVariablesList: z.infer<typeof cssVariablesListValidator>;
        css: string;
      },
    ]
  > {
    const { actions } = serverActions;

    const query = this.getQuery();

    if (!query.slugs || query.slugs.length === 0) {
      return [
        {
          cssVariablesList: [],
          css: "",
        },
      ];
    }

    const result = await actions.cssVariables.list({
      slug: query.slugs,
    });

    const { data: cssVariablesList, info } = result;

    const cssList: string[] = [];
    for (const cssVariables of cssVariablesList) {
      cssList.push(cssVariablesToString(cssVariables));
    }

    return [
      {
        cssVariablesList,
        css: cssList.join("\n"),
      } as Data,
    ];
  }
}

export const $createCSSVariablesNode = () => {
  const node = new CSSVariablesNode();
  return node;
};

export const $getCSSVariablesCSS = () => {
  const node = $getCSSVariablesNode();
  const data = node.getData();

  if (!data) {
    return "";
  }

  return data.css;
};

// This function is used to update the CSS Variables List in the context
// It is used when the CSS Variables List is soft updated (without saving it in wp post)
// see useCSSVariables
export const $updateCSSVariablesListData = (
  editor: LexicalEditor,
  cssVariables: types.CSSVariables,
  contentItem: types.CSSVariablesContentItem,
  options?: {
    variableIndex?: number | undefined;
  }
) => {
  const node = $getCSSVariablesNode();
  const cssVariablesList = node.getData()?.cssVariablesList;

  if (!cssVariablesList) {
    throw new Error("CSSVariablesNode data not found");
  }

  const ID = cssVariables.ID;
  const name = cssVariables.name;

  // Find the CSSVariablesList with the same ID
  const targetCSSVariables = cssVariablesList.find((item) => item.ID === ID);

  if (!targetCSSVariables) {
    logger.log( "CSSVariablesNode data not found");
    return;
  }

  const targetIndex = options?.variableIndex ?? -1;

  // Now swap the contentItem with variableName or index (if provided)
  let newContent = targetCSSVariables.content;
  for (const item of newContent) {
    if (item.variableName === contentItem.variableName) {
      item.initialValue = contentItem.initialValue;
      break;
    }
  }

  // Update the list in the context
  const newCSSVariablesList = cssVariablesList.map((cssVariables) => {
    if (cssVariables.ID === ID) {
      return {
        ...cssVariables,
        content: newContent,
      };
    }
    return cssVariables;
  });

  // Generate the CSS string
  const cssList: string[] = [];
  for (const cssVariables of newCSSVariablesList) {
    cssList.push(cssVariablesToString(cssVariables));
  }
  const css = cssList.join("\n");

  // Update the CSS Variables List in the context
  // const writable = node.getWritable();
  // writable.setData({
  //   cssVariablesList: newCSSVariablesList,
  //   css,
  // });

  $storeFetchedData(node, {
    cssVariablesList: newCSSVariablesList,
    css,
  });
  const writable = node.getWritable();

  editor.dispatchCommand(NODE_CSS_VARIABLES_DATA_UPDATED_COMMAND, {
    node: writable,
  });
};

export const fetchCSSVariablesNode = async (editor: LexicalEditor) => {
  const node = editor.getEditorState().read(() => $getCSSVariablesNode());
  const serverActions = getEditorServerActionsUtils();
  const [data, info] = await fetchDataFetchingNode(
    node,
    editor,
    serverActions,
    {
      useCacheIfExists: false,
    }
  );

  editor.update(
    () => {
      const writable = node.getWritable();
      writable.setData(data);

      editor.dispatchCommand(NODE_CSS_VARIABLES_FETCHED_COMMAND, {
        node: writable,
      });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return data;
};

export const $getCSSVariablesNode = () => {
  const node = $getRoot().getChildren().find($isCSSVariablesNode);
  if (!node) {
    throw new Error("CCSSVariablesNode not found");
  }
  return node;
};

export const $isCSSVariablesNode = (node: any): node is CSSVariablesNode => {
  return (
    node instanceof CSSVariablesNode ||
    (typeof node === "object" && node?.__type === "cssvariables-data")
  );
};

export const addCSSVariables = async (editor: LexicalEditor, slug: string) => {
  const node = editor.read(() => $getCSSVariablesNode());
  if (!node) {
    throw new Error("CSSVariablesNode not found");
  }

  // Return without any action if the slug is already in the node
  if (node.getQuery().slugs?.includes(slug)) {
    logger.log( "CSSVariablesNode already contains the slug");
    return;
  }

  const { data: cssVariablesList } = await actionsCSSVariables.list({
    slug: [slug],
  });

  const customFontSlugs: string[] = [];
  const googleFontParameters: types.GoogleFontsParameters[] = [];

  // Loop through the css variables and CSSVariablesContent
  //
  // If variable is "font" syntax, sync it with the font node
  for (const cssVariables of cssVariablesList) {
    const fontVariables = cssVariablesContentValidator
      .parse(cssVariables.content)
      .filter((item) => item.syntax === "font");

    for (const fontVariable of fontVariables) {
      if (fontVariable.font!.$type === "google") {
        googleFontParameters.push({
          fontFamily: fontVariable.font!.fontFamily!,
          fontWeight: fontVariable.font!.fontWeight,
          fontStyle: fontVariable.font!.fontStyle,
        });
      } else if (fontVariable.font!.$type === "custom") {
        customFontSlugs.push(fontVariable.font?.$slug!);
      }
    }

    if (googleFontParameters.length > 0) {
      editor.update(
        () => {
          for (const params of googleFontParameters) {
            $addGoogleFont(editor, params);
          }
        },
        { discrete: true, tag: HISTORY_MERGE_TAG }
      );
    }

    if (customFontSlugs.length > 0) {
      await addCustomFont(editor, customFontSlugs);
    }
  }

  // Set query in CSSVariablesNode
  editor.update(
    () => {
      const newSlugs = Array.from(
        new Set([slug, ...(node.getQuery().slugs ?? [])])
      );
      const writable = node.getWritable();
      writable.setQuery({ slugs: newSlugs });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

// This function is used to remove the CSS variables from the CSSVariablesNode
export const removeCSSVariables = async (
  editor: LexicalEditor,
  slugs: string[]
) => {
  const node = editor.read(() => $getCSSVariablesNode());
  if (!node) {
    throw new Error("CSSVariablesNode not found");
  }

  // Remove slug from slugs if it is not in the node
  slugs = slugs.filter((slug) =>
    editor.read(() => !$isCSSVariablesUsedByNode(slug))
  );

  if (slugs.length === 0) {
    logger.log( "No CSSVariablesNode to remove");
    return;
  }

  // get css variables list
  const { data: cssVariablesList } = await actionsCSSVariables.list({
    slug: slugs,
  });

  const customFontSlugs: string[] = [];
  const googleFontParameters: types.GoogleFontsParameters[] = [];

  // Loop through the css variables and CSSVariablesContent
  //
  // If variable is "font" syntax, sync it with the font node
  for (const cssVariables of cssVariablesList) {
    const fontVariables = cssVariablesContentValidator
      .parse(cssVariables.content)
      .filter((item) => item.syntax === "font");

    for (const fontVariable of fontVariables) {
      const cssTypography: types.CSSTypography = {
        $type: fontVariable.font!.$type!,
        $slug: fontVariable.font?.$slug,
        fontFamily: fontVariable.font?.fontFamily!,
        fontWeight: fontVariable.font?.fontWeight,
        fontStyle: fontVariable.font?.fontStyle,
      };

      // First Loop through and check if font is used by nodes
      // Skip if font is used by nodes
      if (editor.read(() => $isFontUsedByNode(cssTypography))) {
        continue;
      }

      if (fontVariable.font!.$type === "google") {
        googleFontParameters.push({
          fontFamily: cssTypography.fontFamily!,
          fontWeight: cssTypography.fontWeight,
          // ? cssTypography.fontWeight
          // : undefined,
          fontStyle: cssTypography.fontStyle,
          // ? cssTypography.fontStyle
          // : undefined,
        });
      } else if (fontVariable.font!.$type === "custom") {
        customFontSlugs.push(fontVariable.font?.$slug!);
      }
    }

    if (googleFontParameters.length > 0) {
      editor.update(
        () => {
          for (const params of googleFontParameters) {
            $removeGoogleFontIfNotUsed(editor, params);
          }
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    if (customFontSlugs.length > 0) {
      await removeCustomFont(editor, customFontSlugs);
    }
  }

  // Update query in CSSVariablesNode
  editor.update(
    () => {
      const newSlugs = node
        .getQuery()
        .slugs?.filter((item) => !slugs.includes(item));
      const writable = node.getWritable();
      writable.setQuery({ slugs: newSlugs });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );
};

export const $isCSSVariablesUsedByNode = (
  slug: string,
  exclude?: WPLexicalNode[]
) => {
  let isUsed = false;
  $walkNode($getRoot(), (node) => {
    // Skip if the node is excluded
    if (
      !$isWPLexicalNode(node) ||
      exclude?.some((excludeNode) => excludeNode.getKey() === node.getKey())
    ) {
      return;
    }

    // Check for state styles
    const stateStyles = node.__css.__stylesStates ?? {};

    // Check if css variable is used in the node for any of the devices
    for (const device of STYLE_DEVICES) {
      // Check for the default styles (non-state / "none" state)
      const cssVariables:
        | types.CSSVariablesUsage
        | types.KeyOfCSSVariablesUsageArray =
        node.__css.__styles[device]?.__cssVariablesUsage ?? {};

      isUsed = isUsed || hasCSSVariableWithSlug(cssVariables, slug);

      // Check state styles as well (e.g. hover, active, etc.)
      for (const stateKey of Object.keys(stateStyles) as types.CSSState[]) {
        const stateCSSVariables = (stateStyles[stateKey]?.[device]
          ?.__cssVariablesUsage ?? {}) as types.CSSVariablesUsage;

        isUsed = isUsed || hasCSSVariableWithSlug(stateCSSVariables, slug);
      }

      // Exit early if isUsed is true
      if (isUsed) {
        break;
      }
    }
  });

  return isUsed;
};

export const removeCSSVariableUsage = async (
  editor: LexicalEditor,
  node: WPLexicalNode,
  options: {
    keyofUsage: types.KeyOfCSSVariablesUsageMixed;
    slug: string;
    arrayIndex?: number | undefined;
  }
) => {
  const { keyofUsage, slug, arrayIndex } = options;

  let cssVariableUsage: Record<string, any> =
    getFilteredCSSVariableUsage(editor, node) ?? {};

  // if arrayIndex is provided, we need to remove the specific index from the array
  if (cssVariableUsageKeyType(keyofUsage) === "array") {
    const valueofUsage = cssVariableUsage[keyofUsage];

    if (
      Array.isArray(valueofUsage) &&
      arrayIndex !== undefined &&
      arrayIndex >= 0
    ) {
      cssVariableUsage[keyofUsage] = valueofUsage.filter(
        (item, index) => index !== arrayIndex
      );

      // set value to undefined if the array is empty
      // if (cssVariableUsage[keyofUsage].length === 0) {
      //   cssVariableUsage[keyofUsage] = undefined;
      // }
    }
  } else {
    // Set the css variable usage to undefined
    // which will remove the css variable when calling $updateCSS
    cssVariableUsage[String(keyofUsage)] = undefined;
  }

  // Update the node with the new css variable usage
  editor.update(
    () => {
      $updateCSS({
        editor,
        node,
        styles: {
          __cssVariablesUsage: cssVariableUsage,
        },
      });
    },
    {
      discrete: true,
    }
  );

  // Remove the css variable from CSSVariablesNode
  await removeCSSVariables(editor, [slug]);

  // Fetch the CSSVariablesNode to update the data
  await fetchCSSVariablesNode(editor);

  // Sync font
  syncCSSFont(editor, {
    discrete: true,
  });

  // const latestNode = editor
  //   .getEditorState()
  //   .read(() => $getNodeByKey(node.getKey())) as WPLexicalNode;

  // editor.dispatchCommand(NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND, {
  //   node: latestNode,
  //   keys: [slug as keyof CSSProperties],
  // });
};

export const updateCSSVariableUsage = async <
  T extends types.KeyOfCSSVariablesUsageMixed,
>(
  editor: LexicalEditor,
  node: WPLexicalNode,
  options: {
    keyofUsage: T;
    slug: string;
    variableName: string;
    //altKeyofUsage?: types.AltKeyOfCSSVariablesUsage[];
    arrayIndex?: number | undefined;
  }
) => {
  const { keyofUsage, slug, variableName, arrayIndex } = options;

  const cssVariableUsage = getFilteredCSSVariableUsage(editor, node);

  let cssVariable = cssVariableUsage[keyofUsage];

  let oldSlugs: string[] = [];

  if (cssVariableUsageKeyType(keyofUsage) === "array") {
    if (arrayIndex === -1 && !Array.isArray(cssVariable)) {
      // initialize cssVariable as an empty array if arrayIndex is -1
      cssVariable = [];
    }

    if (!Array.isArray(cssVariable) || arrayIndex === undefined) {
      throw new Error(
        `CSS variable usage for ${keyofUsage} is not an array or arrayIndex is not defined.`
      );
    }
    oldSlugs = cssVariable.map((item) => item.slug);

    // if arrayIndex is -1, then it means we are adding a new item to the array
    if (0 > arrayIndex!) {
      cssVariable.push({
        slug,
        variableName,
        inherit: false,
      });
    } else {
      // If the css variable usage is an array, update the specific index
      cssVariable = cssVariable.map((item, index) => {
        if (index === arrayIndex) {
          return {
            ...item,
            slug,
            variableName,
            inherit: false,
          };
        }
        return item;
      });
    }
  } else {
    if (Array.isArray(cssVariable)) {
      throw new Error(
        `CSS variable usage for ${keyofUsage} is not a single object.`
      );
    }

    // If the css variable usage is an object, we need to store the old slug
    oldSlugs = cssVariable?.slug ? [cssVariable.slug] : [];

    // If the css variable usage is not an array, update the slug and variableName
    cssVariable = {
      slug,
      variableName,
      inherit: false,
    };
  }

  // Update the css variable usage
  cssVariableUsage[keyofUsage] = structuredClone(cssVariable);

  editor.update(
    () => {
      const targetStyles = node.getLatest().__css.targetStyles();
      let cssToRemove: Record<string, any> = {};

      // Before updating the css variable usage, remove the css property if it exists

      // Mark the key as undefined so that it will be removed when calling $updateCSS
      cssToRemove[keyofUsage] = undefined;

      // // If altKeyofUsage is provided, remove the css variable usage for the alt keys
      // if (altKeyofUsage) {
      //   altKeyofUsage.forEach((altKey) => {
      //     cssToRemove[altKey] = undefined;
      //   });
      // }

      // Loop through key starting with __ and remove the css variable usage
      const nestedKeys = Object.keys(targetStyles).filter((k) =>
        k.startsWith("__")
      ) as `__${string}`[];

      nestedKeys.forEach((nestedKey) => {
        if (targetStyles[nestedKey]?.[keyofUsage]) {
          cssToRemove[nestedKey] = {
            ...(cssToRemove?.[nestedKey] ?? {}),
            [keyofUsage]: undefined,
          };
        }
      });

      logger.log(
        "Updating CSS Variable Usage:",
        cssVariableUsage,
        "and removing CSS properties:",
        cssToRemove
      );

      // Update the node with the new css variable usage
      $updateCSS({
        editor,
        node,
        styles: {
          //...cssToRemove,
          __cssVariablesUsage: cssVariableUsage,
        },
      });
    },
    {
      discrete: true,
    }
  );

  await addCSSVariables(editor, slug);

  // Delegate removal of the old css variables from CSSVariablesNode
  if (oldSlugs && oldSlugs.includes(slug)) {
    await removeCSSVariables(editor, oldSlugs);
  }

  // Fetch the CSSVariablesNode to update the data
  await fetchCSSVariablesNode(editor);

  // Sync font after fetching CSSVariablesNode and storing the data in CSSVariablesNode
  syncCSSFont(editor, {
    discrete: true,
  });

  // const latestNode = editor
  //   .getEditorState()
  //   .read(() => $getNodeByKey(node.getKey())) as WPLexicalNode;

  // editor.dispatchCommand(NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND, {
  //   node: latestNode,
  //   keys: [slug as keyof CSSProperties],
  // });
};

export {
  $getCSSVariableContentItem,
  $getCSSVariableContentItemArray,
  $getCSSVariableUsage,
  $getCSSVariableUsageAny,
  $getCSSVariableUsageArray,
  $getCSSVariableUsageKeys,
} from "./css-variables-access";

/**
 * Resolves discrepancies in the usage of CSS variables for a given node.
 *
 * This function ensures that the `__cssVariablesUsage` property of the node's
 * writable CSS object is updated by removing any keys that are already present
 * in the current CSS properties. It also ensures that the CSS variable usage
 * remains consistent with the node's actual CSS properties.
 *
 * Note: This function should be invoked sparingly, ideally with intervals of a few seconds, to avoid performance issues.
 *
 */
// export const $resolveCSSVariableUsageDiscrepancies = (
//   editor: LexicalEditor,
//   node: WPLexicalNode
// ) => {
//   const writable = node.getWritable();

//   const cssVariableUsage: types.CSSVariablesUsage =
//     writable.__css.get().__cssVariablesUsage;

//   if (!cssVariableUsage) {
//     return;
//   }

//   // First check if the node has any CSS variable usage
//   // If not, return without any action
//   const cssVariableUsageKeys = Object.keys(cssVariableUsage);

//   if (cssVariableUsageKeys.length === 0) {
//     return;
//   }

//   const usageToRemove: types.CSSVariablesUsage = {};

//   // Check if the keys in __cssVariableUsage are present in the current CSS properties
//   // and mark them for removal
//   $walkCSS(
//     node,
//     (key) => {
//       if (cssVariableUsageKeys.includes(key)) {
//         // Add the key to usageToRemove for removal later
//         usageToRemove[key] = structuredClone(cssVariableUsage[key]);
//         // Remove the keys from cssVariableUsage because they are already present in the CSS properties
//         delete cssVariableUsage[key];
//       }
//     },
//     { exclude: ["__cssVariablesUsage"] }
//   );

//   $updateCSS({
//     editor,
//     node,
//     styles: {
//       __cssVariablesUsage: cssVariableUsage,
//     },
//   });

//   const slugs = Object.values(usageToRemove)
//     .map((item) => item.slug)
//     .filter((item) => item !== undefined) as string[];

//   // Remove CSSVariable associated with slug in __cssVariableUsage from CSSVariablesNode
//   // and dispatch the command to remove the usage

//   (async () => {
//     await removeCSSVariables(editor, slugs);

//     // Fetch the CSSVariablesNode to update the data
//     await fetchCSSVariablesNode(editor);

//     const latestNode = editor.read(() =>
//       $getNodeByKey(node.getKey())
//     ) as WPLexicalNode;

//     editor.dispatchCommand(NODE_CSS_VARIABLES_USAGE_REMOVED_COMMAND, {
//       node: latestNode,
//       keys: Object.keys(usageToRemove) as Array<keyof CSSProperties>,
//     });

//     editor.dispatchCommand(NODE_CSS_VARIABLES_USAGE_UPDATED_COMMAND, {
//       node: latestNode,
//       keys: Object.keys(usageToRemove) as Array<keyof CSSProperties>,
//     });
//   })();
// };

export const $getCSSCustomProperty = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsage
) => {
  const cssVariablesUsage = $getCSSVariableUsage(node, keyofUsage);

  return !cssVariablesUsage
    ? undefined
    : cssCustomProperty(cssVariablesUsage.slug, cssVariablesUsage.variableName);
};
