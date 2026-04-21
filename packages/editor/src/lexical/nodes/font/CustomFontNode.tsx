import { z } from "zod";

import {
  $isDataFetchingNode,
  $storeFetchedData,
  DataFetchingNode,
  fetchDataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { customFontsDataFetchingValidator } from "./custom-fonts-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";
import { $getRoot, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";
import { NODE_CUSTOM_FONT_UPDATED } from "./commands";
import { getEditorServerActionsUtils } from "../../../server/actions/get-editor-server-actions-utils";
import { $walkNode } from "../../walk-node";
import { $isWPLexicalNode } from "../wp/guards";
import { $getCSSVariableContentItem } from "../css-variables/css-variables-access";
import { STYLE_DEVICES } from "../../styles-core/constants";
import { CSSDevice } from "../../styles-core/css-device";

type Data = {
  fontFamilies: z.infer<typeof customFontsDataFetchingValidator>; //wpTypes.crud.CrudReturnType<"post", "list">["data"];
  fontFaceMap: Record<number, types.FontFace[]>;
  css: string;
};

export class CustomFontNode extends DataFetchingNode<
  {
    // This is slug (post_name) in WpPost
    slugs: string[];
  },
  Data
> {
  // Custom Font can't be editable from left panel
  __hidden: boolean = true;

  static getValidator() {
    return customFontsDataFetchingValidator;
  }

  setName(name: string): void {
    // The value of name is static
    // since there's only one custom font node in the editor
    super.setName("custom-fonts-data-fetching");
  }

  setQuery(query: { slugs: string[] }) {
    // Remove duplicates from IDs
    this.__query = { slugs: Array.from(new Set(query.slugs)) };
  }

  static getType(): string {
    return "customfonts-data";
  }

  static clone(node: CustomFontNode): CustomFontNode {
    const newNode = new CustomFontNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): CustomFontNode {
    const node = $createCustomFontNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  // Do not call this method directly. Use fetchCustomFontNode instead, which handles caching and data management.
  async fetch(serverActions: types.DataServerActions): Promise<
    [
      {
        fontFamilies: z.infer<typeof customFontsDataFetchingValidator>;
        fontFaceMap: Record<number, types.FontFace[]>;
        css: string;
      },
    ]
  > {
    const { actions } = serverActions;

    const query = this.getQuery();

    if (!query.slugs || query.slugs.length === 0) {
      return [
        {
          fontFamilies: [],
          fontFaceMap: {},
          css: "",
        },
      ];
    }

    const result = await actions.font.list({
      slug: query.slugs,
    });

    const { data: posts, info } = result;

    const parsed = customFontsDataFetchingValidator.parse(posts);

    const css = await actions.font.getCssFontFaces(query.slugs);

    return [
      {
        fontFamilies: parsed,
        fontFaceMap: info?.fontFaceMap ?? {},
        css,
      } as Data,
    ];
  }
}

export const $createCustomFontNode = () => {
  const node = new CustomFontNode();
  return node;
};

export const $getCustomFontNode = () => {
  const node = $getRoot().getChildren().find($isCustomFontNode);
  if (!node) {
    throw new Error("CustomFontNode not found");
  }
  return node;
};

export const $isCustomFontNode = (node: any): node is CustomFontNode => {
  return (
    node instanceof CustomFontNode ||
    (typeof node === "object" && node?.__type === "customfonts-data")
  );
};

export const $appendCustomFontNode = () => {
  // Check if font node exists in the root node
  if ($getRoot().getChildren().find($isCustomFontNode)) {
    return false;
  }

  const node = $createCustomFontNode();
  $getRoot().append(node);

  return true;
};

export const $getCustomFontCSS = () => {
  const node = $getCustomFontNode();
  const data = node.getData();

  if (!data) {
    return "";
  }

  return data.css;
};

export const fetchCustomFontNode = async (editor: LexicalEditor) => {
  const node = editor.getEditorState().read(() => $getCustomFontNode());
  const serverActions = getEditorServerActionsUtils();
  const [data] = await fetchDataFetchingNode(node, editor, serverActions, {
    useCacheIfExists: false,
  });

  editor.update(
    () => {
      const writable = node.getWritable();

      writable.setData(data);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  return data;
};

export const addCustomFont = async (editor: LexicalEditor, slugs: string[]) => {
  editor.update(
    () => {
      const node = $getCustomFontNode();
      const writable = node.getWritable();

      const currentSlugs = writable.getQuery()?.slugs ?? [];
      const newSlugs = Array.from(new Set([...currentSlugs, ...slugs]));

      writable.setQuery({ slugs: newSlugs });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  await fetchCustomFontNode(editor);

  editor.dispatchCommand(NODE_CUSTOM_FONT_UPDATED, {
    node: editor.getEditorState().read(() => $getCustomFontNode()),
  });
};

export const removeCustomFont = async (
  editor: LexicalEditor,
  slugs: string[]
) => {
  editor.update(
    () => {
      const node = $getCustomFontNode();
      const writable = node.getWritable();

      const newSlugs = writable
        .getQuery()
        .slugs.filter((slug) => !slugs.includes(slug));

      writable.setQuery({ slugs: newSlugs });
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  await fetchCustomFontNode(editor);

  editor.dispatchCommand(NODE_CUSTOM_FONT_UPDATED, {
    node: editor.getEditorState().read(() => $getCustomFontNode()),
  });
};

export const $syncCustomFont = (editor: LexicalEditor) => {
  let newCustomFontSlugs = new Set<string>();

  // Save the current device
  const currentDevice = CSSDevice.getDevice();

  $walkNode($getRoot(), (node) => {
    // Skip if node is  DataNode which includes CustomFontNode
    if ($isDataFetchingNode(node)) {
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

      // Check and get font from CSS Variables
      const { item: cssContentItem } = $getCSSVariableContentItem(
        node.getLatest(),
        "fontFamily"
      );

      // If node has a CSS Variable for fontFamily,
      // check if it's a Google Font and not already present in newCustomFontSlugs
      // Skip if cssContentItem is missing or not a custom font
      if (
        cssContentItem &&
        cssContentItem.syntax === "font" &&
        cssContentItem.font?.$type === "custom"
      ) {
        const { $slug } = cssContentItem.font;
        // Custom Font is found, add it to the new fonts
        $slug && newCustomFontSlugs.add($slug);
      }

      // Now check if the node has a CSS Font
      const cssFont = node.getLatest()?.__css.get()?.__font as
        | types.CSSTypography
        | undefined;

      // Skip if cssFont is not defined or not a Custom Font
      if (!cssFont || cssFont.$type !== "custom" || !cssFont.$slug) {
        continue;
      }

      // Add the font slug to the newCustomFontSlugs
      newCustomFontSlugs.add(cssFont.$slug);
    }
  });

  // Restore the original device
  CSSDevice.setDevice(currentDevice);

  // Now update the GoogleFontNode with the new fonts
  const node = $getCustomFontNode();
  const writable = node.getWritable();

  writable.setQuery({
    slugs: Array.from(newCustomFontSlugs),
  });

  editor.dispatchCommand(NODE_CUSTOM_FONT_UPDATED, {
    node: editor.getEditorState().read(() => $getCustomFontNode()),
  });
};
