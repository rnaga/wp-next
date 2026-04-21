import { $getRoot } from "lexical";

import { $walkNode } from "../walk-node";
import { $isWPLexicalNode, WPLexicalNode } from "../nodes/wp";

import type * as types from "../../types";

export const $isFontUsedByNode = (
  cssTypography: types.CSSTypography,
  exclude?: WPLexicalNode[]
) => {
  const otherNodes: WPLexicalNode[] = [];

  $walkNode($getRoot(), (node) => {
    if (
      !$isWPLexicalNode(node) ||
      exclude?.some((excludeNode) => excludeNode.getKey() === node.getKey())
    ) {
      return;
    }

    otherNodes.push(node);
  });

  for (const otherNode of otherNodes) {
    const otherCSSTypography: types.CSSTypography =
      otherNode.__css.get().__font ?? {};

    if (
      cssTypography?.$type === otherCSSTypography.$type &&
      cssTypography?.fontFamily === otherCSSTypography.fontFamily &&
      cssTypography?.fontWeight === otherCSSTypography.fontWeight &&
      cssTypography?.fontStyle === otherCSSTypography.fontStyle
    ) {
      return true;
    }
  }

  return false;
};
