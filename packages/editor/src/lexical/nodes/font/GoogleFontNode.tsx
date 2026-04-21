import { $getRoot, DecoratorNode, ElementNode } from "lexical";

import type {
  EditorConfig,
  LexicalEditor,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { NODE_GOOGLE_FONT_UPDATED } from "./commands";
import type * as types from "../../../types";
import { $isDataFetchingNode } from "../data-fetching/DataFetchingNode";
import { $isWPLexicalNode } from "../wp";
import { $getCSSVariableContentItem } from "../css-variables/css-variables-access";
import { $walkNode } from "../../walk-node";
import { STYLE_DEVICES } from "../../styles-core/constants";
import { CSSDevice } from "../../styles-core/css-device";
import { logger } from "../../logger";

export type SerializedFontNode = Spread<
  {
    fonts: types.GoogleFonts;
  },
  SerializedLexicalNode
>;

const defaultGoogleFonts: types.GoogleFonts = {
  Roboto: {
    fontStyle: ["normal"],
  },
  "Open Sans": {
    fontStyle: ["normal"],
  },
};

export class GoogleFontNode extends DecoratorNode<null> {
  __fonts: types.GoogleFonts = structuredClone(defaultGoogleFonts);

  static getType(): string {
    return "googlefont";
  }

  static clone(node: GoogleFontNode): GoogleFontNode {
    const newNode = new GoogleFontNode(node.__key);
    return newNode;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(
    prevNode: GoogleFontNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }

  static importJSON(serializedNode: SerializedFontNode): GoogleFontNode {
    const node = $createGoogleFontNode();
    node.__fonts = serializedNode.fonts;
    return node;
  }

  exportJSON(): SerializedFontNode {
    return {
      ...super.exportJSON(),
      type: "googlefont",
      fonts: this.__fonts,
    };
  }
}

export const $createGoogleFontNode = (node?: GoogleFontNode) => {
  const googleFont = new GoogleFontNode();
  if (node) {
    googleFont.__fonts = node.__fonts;
  }
  return googleFont;
};

export const $isGoogleFontNode = (node: any): node is GoogleFontNode => {
  return (
    node instanceof GoogleFontNode ||
    (typeof node === "object" && node?.__type === "googlefont")
  );
};

export const $getGoogleFontNode = (editor: LexicalEditor) => {
  const node = $getRoot().getChildren().find($isGoogleFontNode);

  // Create a new GoogleFontNode if it doesn't exist
  if (!node) {
    throw new Error(
      "GoogleFontNode not found. Please create a new GoogleFontNode."
    );
  }

  return node as GoogleFontNode;
};

export const newGoogleFonts = () => structuredClone(defaultGoogleFonts);

export const getGoogleFonts = (
  editorOrEditors: LexicalEditor | LexicalEditor[]
): types.GoogleFonts => {
  const editors = Array.isArray(editorOrEditors)
    ? editorOrEditors
    : [editorOrEditors];

  const googleFonts: types.GoogleFonts = {};

  for (const editor of editors) {
    const node = editor.read(() => $getGoogleFontNode(editor));

    Object.entries(node.__fonts).forEach(([key, value]) => {
      googleFonts[key] = {
        fontStyle: [...value.fontStyle, ...(googleFonts[key]?.fontStyle || [])],
      };
    });
  }

  // Deduplicate fontStyle arrays for each font family after merging across multiple editors.
  // The merge loop above concatenates arrays from all editors, so the same style (e.g. "italic")
  // can appear multiple times if more than one editor references the same font.
  for (const key of Object.keys(googleFonts)) {
    googleFonts[key].fontStyle = Array.from(
      new Set(googleFonts[key].fontStyle)
    );
  }

  return googleFonts;
};

export const $addGoogleFont = (
  editor: LexicalEditor,
  font: types.GoogleFontsParameters
) => {
  const node = $getGoogleFontNode(editor);
  const writable = node.getWritable();

  const { fontFamily, fontStyle = "normal" } = font as types.GoogleFontsParameters;

  if (!fontFamily) {
    logger.warn( "Font family is required to add a font.");
    return;
  }

  writable.__fonts[fontFamily] = {
    fontStyle: [...(writable.__fonts[fontFamily]?.fontStyle || []), fontStyle],
  };

  editor.dispatchCommand(NODE_GOOGLE_FONT_UPDATED, { node: writable });
};

export const $syncGoogleFont = (editor: LexicalEditor) => {
  let newGoogleFonts: types.GoogleFonts = structuredClone(defaultGoogleFonts);

  const addFont = (fontFamily: string, fontStyle: types.FontStyle | undefined) => {
    if (!newGoogleFonts[fontFamily]) {
      newGoogleFonts[fontFamily] = {
        fontStyle: [],
      };
    }

    newGoogleFonts[fontFamily].fontStyle.push(fontStyle ?? "normal");
  };

  // Save device
  const currentDevice = CSSDevice.getDevice();

  $walkNode($getRoot(), (node) => {
    // Skip if node is GoogleFontNode or DataNode
    if ($isGoogleFontNode(node) || $isDataFetchingNode(node)) {
      return;
    }

    // Skip if node is not WPLexicalNode
    if (!$isWPLexicalNode(node)) {
      return;
    }

    // Loop through all devices
    for (const device of STYLE_DEVICES) {
      // Set the device for CSS
      CSSDevice.setDevice(device);

      // Get font from CSS Variables
      const { item: cssVariableFont } = $getCSSVariableContentItem(
        node.getLatest(),
        "fontFamily"
      );

      let fontFamily: string | undefined = undefined;

      // Get the CSS font in the node
      const cssNodeFont = node.getLatest()?.__css.get()?.__font as
        | types.CSSTypography
        | undefined;

      const { fontStyle: cssNodeFontStyle } = cssNodeFont || {};

      // Check to see if the node has a CSS Variable for fontFamily
      if (
        cssVariableFont &&
        cssVariableFont.syntax === "font" &&
        cssVariableFont.font?.$type === "google"
      ) {
        const { fontStyle } = cssVariableFont.font;

        if (cssVariableFont.font.fontFamily) {
          // Google Font is found in css variable, add it to the new fonts
          fontFamily = cssVariableFont.font.fontFamily;

          addFont(fontFamily, fontStyle);

          // Node can have its own fontStyle; add it to the new fonts
          addFont(fontFamily, cssNodeFontStyle);
        }

        // continue since we already found the font in css variable
        continue;
      }

      // Check to see if the node has a CSS Font

      // Skip if cssFont is not defined or not a GoogleFont
      if (
        !cssNodeFont ||
        cssNodeFont.$type !== "google" ||
        !cssNodeFont.fontFamily
      ) {
        logger.log( "Font family is required.");
        continue;
      }

      // Google Font is found, add it to the new fonts

      fontFamily = cssNodeFont.fontFamily;

      const { fontStyle } = cssNodeFont;
      addFont(fontFamily, fontStyle);
    }
  });

  // Restore the device
  CSSDevice.setDevice(currentDevice);

  // Ensure fontStyle values are unique per family
  for (const fontFamily of Object.keys(newGoogleFonts)) {
    newGoogleFonts[fontFamily].fontStyle = Array.from(
      new Set(newGoogleFonts[fontFamily].fontStyle)
    );
  }

  // Now update the GoogleFontNode with the new fonts
  const node = $getGoogleFontNode(editor);
  const writable = node.getWritable();

  writable.__fonts = newGoogleFonts;

  // Dispatch the command to broadcast the change
  editor.dispatchCommand(NODE_GOOGLE_FONT_UPDATED, { node: writable });
};

export const $removeGoogleFontIfNotUsed = (
  editor: LexicalEditor,
  font: types.GoogleFontsParameters
) => {
  const node = $getGoogleFontNode(editor);

  const writable = node.getWritable();
  const { fontFamily, fontStyle = "normal" } = font as types.GoogleFontsParameters;

  if (!fontFamily) {
    logger.warn( "Font family is required to remove a font.");
    return;
  }

  const existingFont = writable.__fonts[fontFamily];
  if (existingFont) {
    existingFont.fontStyle = existingFont.fontStyle.filter(
      (s) => !fontStyle.includes(s)
    );

    if (existingFont.fontStyle.length === 0) {
      delete writable.__fonts[fontFamily];
    }
  }

  editor.dispatchCommand(NODE_GOOGLE_FONT_UPDATED, { node: writable });
};

export const $clearGoogleFonts = (editor: LexicalEditor) => {
  const fontNode = $getGoogleFontNode(editor);

  const writable = fontNode.getWritable();
  writable.__fonts = {};

  editor.dispatchCommand(NODE_GOOGLE_FONT_UPDATED, { node: writable });
};

const googleFontsBaseUrl = "https://fonts.googleapis.com/css";

export const mergeGoogleFonts = (
  fonts1?: types.GoogleFonts,
  fonts2?: types.GoogleFonts
): types.GoogleFonts => {
  // Merge the googleFonts and customFonts from both fonts
  // structuredClone so we don't mutate the caller's fonts1 object
  const mergedGoogleFonts = structuredClone(fonts1 ?? {});

  if (!fonts2) {
    return mergedGoogleFonts;
  }

  Object.entries(fonts2).forEach(([key, value]) => {
    if (mergedGoogleFonts[key]) {
      mergedGoogleFonts[key].fontStyle = [
        ...mergedGoogleFonts[key].fontStyle,
        ...value.fontStyle,
      ];
    } else {
      mergedGoogleFonts[key] = {
        fontStyle: [...value.fontStyle],
      };
    }
  });

  // Ensure fontStyle values are unique per family
  Object.values(mergedGoogleFonts).forEach((font) => {
    font.fontStyle = Array.from(new Set(font.fontStyle));
  });

  return mergedGoogleFonts;
};

// export const $syncGoogleFonts = (editor: LexicalEditor) => {
//   const fontNode = $getGoogleFontNode(editor);
//   const writable = fontNode.getWritable();

//   // Get the current Google Fonts
//   const currentFonts = getGoogleFonts(editor);

//   for (const [
//     fontFamily,
//     { fontWeight: fontWeights, fontStyle: fontStyles },
//   ] of Object.entries(writable.__fonts)) {
//     $walkNode($getRoot(), (node) => {});
//   }
// };

// All standard font weights supported by Google Fonts.
// TODO: Replace with weights actually used in the template by walking node CSS
// (similar to $syncGoogleFont) so the URL is minimal. For now we request all
// weights to avoid missing any variant when GoogleFontNode.__fonts is stale.
const ALL_FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Builds a Google Fonts v2 API query string from a `types.GoogleFonts` map.
 *
 * Each font family entry carries only `fontStyle` (e.g. `["normal", "italic"]`).
 * Because `GoogleFontNode.__fonts` may not reflect every weight actually used in
 * the template (nodes can be added before a sync), all nine standard weights
 * (100–900) are requested for every style variant. This trades a slightly larger
 * URL for the guarantee that no weight is ever missing at render time.
 *
 * Oblique is not a valid Google Fonts style axis value and is silently skipped.
 *
 * @param fonts - Map of font-family name → `{ fontStyle: string[] }`.
 * @returns A `family=…&display=swap` query string, or `""` if the map is empty.
 *
 * Example:
 * const myFonts: types.GoogleFonts = {
 *   Roboto: { fontStyle: ["normal", "italic"] },
 *   "Open Sans": { fontStyle: ["normal"] },
 * };
 * buildGoogleFontQueryString(myFonts);
 * // → "family=Roboto:ital,wght@0,100;...;0,900;1,100;...;1,900|Open+Sans:ital,wght@0,100;...;0,900&display=swap"
 */

const buildGoogleFontQueryString = (fonts: types.GoogleFonts): string => {
  const families: string[] = [];

  for (const fontName in fonts) {
    const font = fonts[fontName];
    const variations: string[] = [];

    for (const style of font.fontStyle) {
      // Always request all weights so no variant is missing due to stale
      // GoogleFontNode data (e.g. a node added with weight 800 before the
      // node was synced would otherwise produce a URL missing weight 800).
      for (const weight of ALL_FONT_WEIGHTS) {
        const stylePrefix = style === "italic" ? "1" : "0";
        variations.push(`${stylePrefix},${weight}`);
      }
    }

    if (variations.length > 0) {
      families.push(`${fontName}:${variations.join(";")}`);
    }
  }

  // If no families are found, return an empty string, otherwise return the query string
  return families.length ? `family=${families.join("|")}&display=swap` : "";
};

export const buildGoogleFontsStyleLink = (fonts: types.GoogleFonts) => {
  // Form query string for Google Fonts API
  const googleFontQueryString = buildGoogleFontQueryString(fonts);

  if (googleFontQueryString.length === 0) {
    return null;
  }

  return `${googleFontsBaseUrl}?${googleFontQueryString}`;
};
