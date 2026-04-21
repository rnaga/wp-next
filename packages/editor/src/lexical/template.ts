import { $getRoot, HISTORY_MERGE_TAG, LexicalEditor } from "lexical";

import * as actionsCustomCode from "../server/actions/custom-code";
import * as actionsPreview from "../server/actions/preview";
import * as actionsTemplate from "../server/actions/template";
import { parseCustomCode } from "./custom-code";
import {
  $createCacheNode,
  $isCacheNode,
  $storeCacheData,
} from "./nodes/cache/CacheNode";
import { $isCSSVariablesNode } from "./nodes/css-variables/CSSVariablesNode";
import { CUSTOM_CODE_INJECT_LOCATIONS } from "./nodes/custom-code/constants";
import {
  $isCustomCodeNode,
  mergeCustomCodeSlugs,
} from "./nodes/custom-code/CustomCodeNode";
import { $isDataFetchingNode } from "./nodes/data-fetching/DataFetchingNode";
import { $checkAndInsertErrorDataFetchingNode } from "./nodes/error-data-fetching/ErrorDataFetchingNode";
import { $getCustomFontCSS } from "./nodes/font/CustomFontNode";
import {
  buildGoogleFontsStyleLink,
  getGoogleFonts,
  newGoogleFonts,
} from "./nodes/font/GoogleFontNode";
import { $isFormNode } from "./nodes/form/FormNode";
import {
  $isWidgetNode,
  processAllWidgets,
  processAllWidgetsSync,
} from "./nodes/widget/WidgetNode";
import { cssToStringFromEditor } from "./styles-core/css";
import { generateKeyframeCSSAndJS } from "./styles/animation";
import { $walkNode } from "./walk-node";

import type * as types from "../types";
import { logger } from "./logger";

type ParseJsonString = typeof import("./lexical").parseJsonString;
type ParseJsonStringSync = typeof import("./lexical").parseJsonStringSync;

const parseJsonStringAsync = (
  editor: LexicalEditor,
  content?: string
): ReturnType<ParseJsonString> => {
  // Defer loading to avoid circular dependency with lexical.ts.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseJsonString } = require("./lexical") as {
    parseJsonString: ParseJsonString;
  };
  return parseJsonString(editor, content);
};

const parseJsonStringSyncLocal = (
  editor: LexicalEditor,
  content: string
): ReturnType<ParseJsonStringSync> => {
  // Defer loading to avoid circular dependency with lexical.ts.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseJsonStringSync } = require("./lexical") as {
    parseJsonStringSync: ParseJsonStringSync;
  };
  return parseJsonStringSync(editor, content);
};

export const processAndGetTemplateSync = (
  editor: LexicalEditor,
  stateString: string,
  cacheData: Record<string, any>
) => {
  const cacheNode = editor
    .getEditorState()
    .read(() => $getRoot().getChildren().find($isCacheNode));

  // Create CacheNode if it doesn't exist
  editor.update(
    () => {
      if (!cacheNode) {
        const cacheNode = $createCacheNode();
        $getRoot().getWritable().append(cacheNode);
      }

      $storeCacheData(cacheData);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  parseJsonStringSyncLocal(editor, stateString);
  processAllWidgetsSync(editor);
};

export const processAndGetTemplateInPreviewMode = async (
  templateId: number,
  editor: LexicalEditor,
  infoKey?: string
): Promise<
  | { valid: false; brokenJson?: string; error?: string }
  | (Extract<types.ProcessAndGetTemplateResult, { valid: true }> & {
      previewInfo: types.TemplatePreviewInfo;
      editorStateKey: string;
      editorStateString: string;
    })
> => {
  let editorStateString = "";
  let previewInfo: types.TemplatePreviewInfo | undefined;
  let editorStateKey: string | undefined;

  if (infoKey) {
    const result = await actionsPreview.getPreviewEditorStateByInfoKey(
      templateId,
      infoKey
    );

    if (!result.success) {
      logger.error(
        `Failed to get preview editor state for infoKey: ${infoKey} templateId: ${templateId} error: ${result.error}`
      );

      return {
        valid: false,
      };
    }

    editorStateString = result.data.editorStateString;
    previewInfo = result.data.previewInfo;
    editorStateKey = result.data.editorStateKey;
  } else {
    const result = await actionsPreview.getLatestPreviewEditorState(templateId);

    if (!result.success) {
      logger.error(
        `Failed to get latest preview editor state for templateId: ${templateId} error: ${result.error}`
      );

      return {
        valid: false,
      };
    }

    editorStateString = result.data.editorStateString;
    previewInfo = result.data.previewInfo;
    editorStateKey = result.data.editorStateKey;
  }

  let result: types.ProcessAndGetTemplateResult;
  try {
    result = await processAndGetTemplate(templateId, editor, {
      isEditorMode: false,
      editorStateString,
    });
  } catch (e) {
    return {
      valid: false,
      brokenJson: editorStateString,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (!result.valid) {
    return { valid: false };
  }

  return {
    ...result,
    previewInfo,
    editorStateKey,
    editorStateString,
  };
};

export const processAndGetTemplate = async (
  templateIdOrSlug: number | string,
  editor: LexicalEditor,
  options?: {
    updateEditorState?: boolean;
    preload?: types.PreloadedTemplateMapping;
    isEditorMode?: boolean;
    editorStateString?: string;
    previewInfoKey?: string;
  }
): Promise<types.ProcessAndGetTemplateResult> => {
  const {
    updateEditorState = true,
    preload,
    isEditorMode = true,
    previewInfoKey,
  } = options || {};

  let template = preload?.template;
  let editorStateString = options?.editorStateString;

  if (!template) {
    // Fetch the template
    const { data } = await actionsTemplate.get(templateIdOrSlug);

    if (!data) {
      return {
        valid: false,
      };
    }

    editorStateString = editorStateString
      ? editorStateString
      : data.post_content;

    template = data;
  }

  // If previewInfoKey is provided, fetch the editorStateString from preview util function.
  if (previewInfoKey) {
    const resultPreviewInfo =
      await actionsPreview.getPreviewEditorStateByInfoKey(
        template.ID,
        previewInfoKey
      );

    if (!resultPreviewInfo.success) {
      return {
        valid: false,
      };
    }

    editorStateString = resultPreviewInfo.data.editorStateString;
  }

  if (updateEditorState) {
    await parseJsonStringAsync(editor, editorStateString);
  }

  // If template is tied to error template, then attach ErrorDataFetchingNode.
  // Note: ErrorDataFetchingNode should have been added when template was created (see create function in server/actions/template.ts),
  // but this is a safety check to ensure it gets added if missing for any reason.
  editor.update(
    () => {
      $checkAndInsertErrorDataFetchingNode(template.post_name);
    },
    {
      discrete: true,
      tag: HISTORY_MERGE_TAG,
    }
  );

  const widgetSlugs: string[] = [];
  let styles = "";
  let googleFonts = newGoogleFonts();
  let formScript = "";
  let cssVariablesSet = new Set<string>();
  const customFonts: string[] = [];
  let customCodeSlugs: Record<types.CustomCodeInjectLocation, string[]> = {
    header: [],
    footer: [],
  };

  const dataMapping: types.FetchedDataMapping = {};
  const widgetEditorStateMapping: Record<string, string> = {};

  const callback = async (args: {
    editor: LexicalEditor;
    nestedEditors: LexicalEditor[];
  }) => {
    // Merge all fonts from root and nested editors (those created by widgets)
    googleFonts = getGoogleFonts([args.editor, ...args.nestedEditors]);

    for (const editor of [args.editor, ...args.nestedEditors]) {
      styles += cssToStringFromEditor(editor, { isEditorMode });

      editor.read(() => {
        customFonts.push($getCustomFontCSS());

        $walkNode($getRoot(), (node) => {
          if ($isWidgetNode(node)) {
            widgetSlugs.push(node.slug);
          }

          if ($isDataFetchingNode(node)) {
            const data = node.getData();
            dataMapping[node.getName()] = data;
          }

          if ($isWidgetNode(node) && node.slug && node.slug.length > 0) {
            widgetEditorStateMapping[node.slug] = JSON.stringify(
              node.editor?.getEditorState()
            );
          }

          if ($isFormNode(node)) {
            const submitHandler = node.getSubmitHandler();
            if (submitHandler?.jsFunction) {
              formScript += `;${submitHandler.jsFunction}`;
            }
          }

          if ($isCSSVariablesNode(node)) {
            const cssVariables = node.getData()?.css;
            if (cssVariables) {
              cssVariablesSet.add(cssVariables);
            }
          }

          if ($isCustomCodeNode(node)) {
            customCodeSlugs.header = mergeCustomCodeSlugs(
              customCodeSlugs.header,
              node.__slugs.header
            );
            customCodeSlugs.footer = mergeCustomCodeSlugs(
              customCodeSlugs.footer,
              node.__slugs.footer
            );
          }
        });
      });
    }
  };

  await processAllWidgets(editor, { callback, preload });

  // fetch custom codes per location
  let customCodes: types.PreloadedTemplateMapping["customCodes"] =
    preload?.customCodes ?? { header: [], footer: [] };

  if (!preload?.customCodes) {
    for (const location of CUSTOM_CODE_INJECT_LOCATIONS) {
      if (customCodeSlugs[location].length > 0) {
        const { data } = await actionsCustomCode.getBySlugs(
          customCodeSlugs[location]
        );
        customCodes[location] = data;
      }
    }
  }

  const googleFontLink = buildGoogleFontsStyleLink(googleFonts);
  const customFontStyles = customFonts.join("");
  const parsedCustomCode: Record<
    types.CustomCodeInjectLocation,
    types.ParsedCustomCode
  > = {
    header: parseCustomCode(customCodes.header ?? []),
    footer: parseCustomCode(customCodes.footer ?? []),
  };

  // Generate keyframes CSS and JS for animations
  const { css: animationCSSArray, js: animationJSArray } =
    generateKeyframeCSSAndJS(editor);

  if (animationCSSArray.length > 0) {
    styles = `${styles}\n${animationCSSArray.join("\n")}`;
  }

  const animationScript =
    animationJSArray.length > 0
      ? `(() => {
  const setupAnimations = () => {
${animationJSArray
  .map((script) => `    ${script.replace(/\n/g, "\n    ")}`)
  .join("\n")}
  };

  setupAnimations();
  window.addEventListener("resize", setupAnimations);
})();`
      : "";

  editorStateString = JSON.stringify(editor.getEditorState());

  return {
    valid: true,
    styles,
    customFontStyles,
    cssVariables: Array.from(cssVariablesSet).join("\n"),
    googleFonts,
    googleFontLink,
    customFonts,
    parsedCustomCode,
    animationScript,
    formScript,
    widgetSlugs,
    editorStateString,
    template,
    preload: {
      template,
      editorStateString,
      fetchedData: dataMapping,
      widgetEditorState: widgetEditorStateMapping,
      customCodes,
    },
  };
};
