"use server";

import { RESOURCE_TITLES } from "../lexical/resource-loader/constants";
import { getWpPage } from "./get-wp-page";

import type * as types from "../types";

interface InlineScript {
  title: string;
  content: string;
  runOnDOMReady?: boolean;
}

interface InlineStyle {
  title: string;
  content: string;
}

interface HeaderSection {
  inlineScripts: InlineScript[];
  inlineStyles: InlineStyle[];
  parsedCustomCode: types.ParsedCustomCode;
  googleFontLink: string | null;
}

interface FooterSection {
  parsedCustomCode: types.ParsedCustomCode;
}

export type GetWpPageResourcesResult = {
  valid: true;
  header: HeaderSection;
  footer: FooterSection;
  bodyAttributes: Record<string, string>;
};

/**
 * Builds page resource sections (header / footer) from a processed WP page.
 *
 * Accepts the same arguments as `getWpPage` and calls it internally.
 * Returns `false` when `getWpPage` returns `false` (invalid / unpublished template).
 *
 * - `header` contains inline scripts, inline styles, and header custom code —
 *   all resources that belong in the `<head>`.
 * - `footer` contains only footer custom code.
 */
export const getWpPageResources = async (
  args: types.WpPageArgs
): Promise<
  | {
      valid: false;
      statusType: types.WPPageStatusType;
      message: string;
    }
  | GetWpPageResourcesResult
> => {
  const result = await getWpPage(args);

  if (result.valid === false) {
    return {
      valid: false,
      statusType: result.statusType,
      message: result.message,
    };
  }

  const {
    styles,
    cssVariables,
    customFontStyles,
    animationScript,
    formScript,
    parsedCustomCode,
    template,
    editor,
    cachedData,
    googleFontLink,
    bodyAttributes,
  } = result;

  // Inline scripts: animation, form handling, editor state, cached data, and template ID
  // - animation-script: Runs animation logic after DOM loads (runOnDOMReady: true)
  // - form-script: Handles form interactions after DOM loads (runOnDOMReady: true)
  // - edit-state-json: Stores serialized Lexical editor state globally for client-side access (runs immediately)
  // - cached-data: Stores query cache data globally for client-side access (runs immediately)
  // - template-id: Stores the current template ID globally (runs immediately)
  const inlineScripts: InlineScript[] = [
    ...(animationScript
      ? [
          {
            title: RESOURCE_TITLES.ANIMATION_SCRIPT,
            content: animationScript,
            runOnDOMReady: true,
          },
        ]
      : []),
    ...(formScript
      ? [
          {
            title: RESOURCE_TITLES.FORM_SCRIPT,
            content: formScript,
            runOnDOMReady: true,
          },
        ]
      : []),
    {
      title: RESOURCE_TITLES.EDIT_STATE_JSON,
      content: `globalThis.__editorStateJSON = ${JSON.stringify(
        editor.getEditorState().toJSON()
      )};`,
    },
    {
      title: RESOURCE_TITLES.CACHED_DATA,
      content: `globalThis.__cachedData = ${JSON.stringify(cachedData)};`,
    },
    {
      title: RESOURCE_TITLES.TEMPLATE_ID,
      content: `globalThis.__templateId = ${template.ID};`,
    },
  ];

  // Inline styles: CSS variables, custom fonts, and component styles
  // - css-variables: Design token variables for consistent theming (if any)
  // - custom-fonts: User-uploaded custom font definitions (if any)
  // - component-styles: Generated styles from Lexical editor components
  const inlineStyles: InlineStyle[] = [
    ...(cssVariables
      ? [
          {
            title: RESOURCE_TITLES.CSS_VARIABLES,
            content: cssVariables,
          },
        ]
      : []),
    ...(customFontStyles
      ? [
          {
            title: RESOURCE_TITLES.CUSTOM_FONTS,
            content: customFontStyles,
          },
        ]
      : []),
    {
      title: RESOURCE_TITLES.COMPONENT_STYLES,
      content: styles,
    },
  ];

  return {
    valid: true,
    header: {
      inlineScripts,
      inlineStyles,
      parsedCustomCode: parsedCustomCode.header,
      googleFontLink: googleFontLink ?? null,
    },
    footer: {
      parsedCustomCode: parsedCustomCode.footer,
    },
    bodyAttributes,
  };
};
