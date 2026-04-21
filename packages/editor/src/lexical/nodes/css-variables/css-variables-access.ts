import { $getRoot, LexicalEditor } from "lexical";

import type * as types from "../../../types";
import type { WPLexicalNode } from "../wp";
import { logger } from "../../logger";

const $getCSSVariablesNode = () => {
  const node = $getRoot()
    .getChildren()
    .find((child) => {
      const childAny = child as any;
      const type = childAny?.getType?.();
      return (
        type === "cssvariables-data" || childAny?.__type === "cssvariables-data"
      );
    });

  if (!node) {
    throw new Error("CSSVariablesNode not found");
  }

  return node as {
    getData?: () => { cssVariablesList?: types.CSSVariablesList };
  };
};

export const $getCSSVariableUsageAny = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsage | types.KeyOfCSSVariablesUsageArray
):
  | types.ValueOfCSSVariablesUsage
  | types.ValueOfCSSVariablesUsage[]
  | undefined => {
  const cssVariableUsage: types.CSSVariablesUsageMixed = node
    .getLatest()
    .__css.get().__cssVariablesUsage;

  const cssVariable = cssVariableUsage?.[keyofUsage];
  if (!cssVariable) {
    return undefined;
  }

  return cssVariable;
};

export const $getCSSVariableUsage = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsage
): types.ValueOfCSSVariablesUsage | undefined => {
  const cssVariable = $getCSSVariableUsageAny(node, keyofUsage);

  if (Array.isArray(cssVariable)) {
    throw new Error(
      `CSSVariablesUsage should not be an array. Please check the node's __cssVariablesUsage property. keyofUsage: ${keyofUsage}`
    );
  }

  return cssVariable;
};

export const $getCSSVariableUsageArray = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsageArray
): types.ValueOfCSSVariablesUsage[] | undefined => {
  const cssVariable = $getCSSVariableUsageAny(node, keyofUsage);

  if (cssVariable && !Array.isArray(cssVariable)) {
    throw new Error(
      `CSSVariablesUsage should be an array. Please check the node's __cssVariablesUsage property. keyofUsage: ${keyofUsage}`
    );
  }

  return cssVariable as types.ValueOfCSSVariablesUsage[] | undefined;
};

export const $getCSSVariableContentItem = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsage
):
  | {
      collectionID: number;
      collectionSlug: string;
      item: types.CSSVariablesContentItem;
      index: number;
    }
  | {
      collectionID: undefined;
      collectionSlug: undefined;
      item: undefined;
      index: -1;
    } => {
  const cssVariableUsage = $getCSSVariableUsage(node, keyofUsage);

  if (!cssVariableUsage)
    return {
      collectionID: undefined,
      collectionSlug: undefined,
      item: undefined,
      index: -1,
    };

  const cssVariablesNode = $getCSSVariablesNode();
  const cssVariablesList = cssVariablesNode.getData?.()?.cssVariablesList;

  logger.log( "CSS Variables List:", cssVariablesList, cssVariablesNode);

  let contentItemIndex: number = -1;
  let collectionSlug: string | undefined = undefined;
  let collectionID: number | undefined = undefined;

  const contentItem = cssVariablesList
    ?.find((item) => item.slug === cssVariableUsage.slug)
    ?.content.find((item, index) => {
      const result = item.variableName === cssVariableUsage.variableName;
      if (result) {
        collectionID = cssVariablesList.find(
          (item) => item.slug === cssVariableUsage.slug
        )?.ID;
        contentItemIndex = index;
        collectionSlug = cssVariableUsage.slug;
      }
      return result;
    });

  return !contentItem || !collectionSlug || collectionID === undefined
    ? {
        collectionID: undefined,
        collectionSlug: undefined,
        item: undefined,
        index: -1,
      }
    : {
        collectionID,
        collectionSlug,
        item: contentItem,
        index: contentItemIndex,
      };
};

export const $getCSSVariableContentItemArray = (
  node: WPLexicalNode,
  keyofUsage: types.KeyOfCSSVariablesUsageArray
): {
  collectionID: number;
  collectionSlug: string;
  item: types.CSSVariablesContentItem;
  index: number;
}[] => {
  const cssVariableUsage = $getCSSVariableUsageArray(node, keyofUsage);

  if (!cssVariableUsage) return [];

  const cssVariablesNode = $getCSSVariablesNode();
  const cssVariablesList = cssVariablesNode.getData?.()?.cssVariablesList;

  let contentItemIndexArray: {
    collectionID: number;
    collectionSlug: string;
    item: types.CSSVariablesContentItem;
    index: number;
  }[] = [];

  for (const item of cssVariableUsage) {
    cssVariablesList
      ?.find((cssVariables) => cssVariables.slug === item.slug)
      ?.content.find((contentItem, index) => {
        const result = contentItem.variableName === item.variableName;
        if (result) {
          contentItemIndexArray.push({
            collectionID:
              cssVariablesList.find(
                (cssVariables) => cssVariables.slug === item.slug
              )?.ID ?? -1,
            collectionSlug: item.slug,
            item: contentItem,
            index,
          });
        }
        return result;
      });
  }

  return contentItemIndexArray.length > 0 ? contentItemIndexArray : [];
};

export const $getCSSVariableUsageKeys = (node: WPLexicalNode) => {
  const cssVariableUsage: types.CSSVariablesUsage =
    node.__css.get().__cssVariablesUsage;

  if (!cssVariableUsage) {
    return [];
  }

  return Object.keys(cssVariableUsage);
};
