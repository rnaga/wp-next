import { LexicalEditor } from "lexical";

import { WPLexicalNode } from "../nodes/wp";
import { fetchCSSVariablesNode } from "../nodes/css-variables/CSSVariablesNode";
import { addCustomFont, removeCustomFont } from "../nodes/font/CustomFontNode";
import {
  $addGoogleFont,
  $removeGoogleFontIfNotUsed,
} from "../nodes/font/GoogleFontNode";
import { $updateCSS } from "../styles-core/css";
import { syncCSSFont } from "./font-sync";
import { $isFontUsedByNode } from "./font-usage";

import type * as types from "../../types";

export const textShadowValuesToCSSArray = (
  values: (types.CSSTextShadowValue | undefined)[]
): string[] | undefined => {
  const convertToCSSValue = (val: types.CSSTextShadowValue): string => {
    // Handle empty or missing values gracefully
    const offsetX = val.offsetX?.trim() || "0px";
    const offsetY = val.offsetY?.trim() || "0px";
    const blurRadius = val.blurRadius?.trim() || "0px";
    const color = val.color?.trim() || "";
    return `${offsetX} ${offsetY} ${blurRadius} ${color}`.trim();
  };

  return !values || values.length === 0
    ? []
    : values.filter((v) => !!v).map(convertToCSSValue);
};

export const $getCSSTypography = (node: WPLexicalNode) => {
  const cssTypography: types.CSSTypography | undefined =
    node.__css.get().__font;
  return cssTypography;
};

export const updateCSSTypography = async (
  editor: LexicalEditor,
  node: WPLexicalNode,
  type: types.FontType | undefined,
  styles: Partial<Omit<types.CSSTypography, "$type">>
) => {
  // Remove the current font from Font Node
  const cssTypography: types.CSSTypography | undefined =
    node.__css.get().__font;

  // First remove the current font from the Font Node (only if not used by other nodes)
  const isSameFontUsedByOthers = editor.read(
    () => cssTypography && $isFontUsedByNode(cssTypography, [node])
  );

  if (
    !isSameFontUsedByOthers &&
    cssTypography?.$type &&
    cssTypography?.fontFamily
  ) {
    switch (cssTypography.$type) {
      case "google": {
        editor.update(
          () => {
            $removeGoogleFontIfNotUsed(editor, {
              fontFamily: cssTypography?.fontFamily,
              fontWeight: cssTypography?.fontWeight,
              // ? [cssTypography.fontWeight]
              // : undefined,
              fontStyle: cssTypography?.fontStyle,
              // ? [cssTypography.fontStyle]
              // : undefined,
            });
          },
          {
            discrete: true,
          }
        );

        break;
      }
      case "custom": {
        if (cssTypography?.$slug) {
          await removeCustomFont(editor, [cssTypography?.$slug]);
        }
        break;
      }
      // Omit raw case as it doesn't need to be removed
    }
  }

  // Now add the new font to the Font Node
  switch (type) {
    case "google": {
      editor.update(
        () => {
          $addGoogleFont(editor, styles as types.GoogleFontsParameters);
        },
        {
          discrete: true,
        }
      );
      break;
    }
    case "custom": {
      if (styles.$slug) {
        await addCustomFont(editor, [styles.$slug]);
      }
      break;
    }
    // Omit raw case as it doesn't need to be added
  }

  // Get the font family from the styles
  // If the font family is not set, set it as undefined
  // If the font family is set, split it by comma and trim each item
  // If the font family has spaces, wrap it in quotes
  // If the font family has quotes, remove them
  const fontFamily = !styles.fontFamily
    ? undefined
    : styles.fontFamily
        ?.split(",")
        .map((item) => {
          const trimmedItem = item.trim().replace(/['"]/g, "");

          return /\s/.test(trimmedItem) ? `"${trimmedItem}"` : trimmedItem;
        })
        .join(",");

  // Set the font in the node
  editor.update(
    () => {
      const cssFont = node.getLatest().__css.get().__font;
      $updateCSS({
        editor,
        node,
        styles: {
          __font: {
            $type: type,
            $slug: styles.$slug ?? undefined,
            fontFamily: fontFamily || undefined,
            // If fontWeight and fontStyle are undefined, set the current values
            fontWeight: styles.fontWeight || cssFont?.fontWeight || undefined,
            fontStyle: styles.fontStyle || cssFont?.fontStyle || undefined,
          } satisfies types.CSSTypography,
        },
      });
    },
    {
      discrete: true,
    }
  );

  // Fetch cssVariables and sync fonts
  await fetchCSSVariablesNode(editor);

  syncCSSFont(editor, {
    discrete: true,
  });
};

export { $isFontUsedByNode } from "./font-usage";
export { syncCSSFont } from "./font-sync";
