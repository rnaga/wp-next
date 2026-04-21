//import type { LexicalEditor } from "lexical";
import { $getRoot, LexicalEditor } from "lexical";
import { cssToStringFromEditor } from "../styles-core/css";
import { $walkNode, walkAllEditors } from "../lexical";
import { setInnerHTML } from "../custom-code";
import { CUSTOM_CODE_ATTRIBUTE, RESOURCE_TITLES } from "./constants";
import { generateKeyframeCSSAndJS } from "../styles/animation";
import { $isFormNode } from "../nodes/form/FormNode";
import {
  buildGoogleFontsStyleLink,
  getGoogleFonts,
  newGoogleFonts,
} from "../nodes/font/GoogleFontNode";
import { $getCustomFontCSS } from "../nodes/font/CustomFontNode";
import { $isCSSVariablesNode } from "../nodes/css-variables/CSSVariablesNode";

import type * as types from "../../types";
import { logger } from "../logger";

/**
 * Client-side utility to inject or update a style element.
 * - header: appended to <head>
 * - footer: appended to <body> (before </body>)
 * On update, the element is replaced in its current parent position.
 */
const injectStyle = (
  title: string,
  content: string,
  options?: {
    location?: types.CustomCodeInjectLocation;
    attributes?: Record<string, string>;
  }
) => {
  if (!content) return;

  const { location = "header", attributes } = options || {};

  const existingStyle = document.querySelector(
    `style[${CUSTOM_CODE_ATTRIBUTE}="${title}"]`
  ) as HTMLStyleElement;

  if (existingStyle) {
    // Force browser to reparse and reapply styles by removing and re-adding the element
    // Simply updating textContent doesn't always trigger CSSOM re-evaluation
    const parent = existingStyle.parentNode;
    const nextSibling = existingStyle.nextSibling;

    existingStyle.remove();

    const newStyle = document.createElement("style");
    newStyle.setAttribute(CUSTOM_CODE_ATTRIBUTE, title);
    newStyle.textContent = content;

    if (attributes) {
      for (const key in attributes) {
        newStyle.setAttribute(key, attributes[key]);
      }
    }

    if (parent) {
      parent.insertBefore(newStyle, nextSibling);
    } else if (location === "footer") {
      document.body.appendChild(newStyle);
    } else {
      document.head.appendChild(newStyle);
    }

    return;
  }

  const style = document.createElement("style");
  style.setAttribute(CUSTOM_CODE_ATTRIBUTE, title);
  style.textContent = content;

  if (attributes) {
    for (const key in attributes) {
      style.setAttribute(key, attributes[key]);
    }
  }

  if (location === "footer") {
    document.body.appendChild(style);
  } else {
    document.head.appendChild(style);
  }
};

/**
 * Client-side utility to inject or update a script element.
 * - header: appended to <head>
 * - footer: appended to <body> (before </body>)
 * On update, the existing element is removed and a new one is created.
 */
const injectScript = (
  title: string,
  content: string,
  options?: {
    location?: types.CustomCodeInjectLocation;
    attributes?: Record<string, string>;
    runOnDOMReady?: boolean;
  }
) => {
  if (!content) return;

  const {
    location = "header",
    attributes,
    runOnDOMReady = false,
  } = options || {};

  const existingScript = document.querySelector(
    `script[${CUSTOM_CODE_ATTRIBUTE}="${title}"]`
  );
  if (existingScript) {
    existingScript.remove();
  }

  const scriptContent = runOnDOMReady
    ? `
    (function() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {${content}});
      } else {
        ${content}
      }
    })();
  `
    : content;

  const script = document.createElement("script");
  script.setAttribute(CUSTOM_CODE_ATTRIBUTE, title);
  script.textContent = scriptContent;

  if (attributes) {
    for (const key in attributes) {
      script.setAttribute(key, attributes[key]);
    }
  }

  if (location === "footer") {
    document.body.appendChild(script);
  } else {
    document.head.appendChild(script);
  }
};

/**
 * Client-side utility to inject or update an HTML element.
 * - header: inserted as the first child of <body>
 * - footer: appended to <body> (before </body>)
 * On update, the existing element's content is replaced in place.
 */
const injectHTML = (
  title: string,
  content: string,
  options?: {
    location?: types.CustomCodeInjectLocation;
    attributes?: Record<string, string>;
  }
) => {
  if (!content) return;

  const { location = "header", attributes } = options || {};

  const existingDiv = document.querySelector(
    `div[${CUSTOM_CODE_ATTRIBUTE}="${title}"]`
  ) as HTMLDivElement;

  if (existingDiv) {
    setInnerHTML(existingDiv, content, title);
    if (attributes) {
      for (const key in attributes) {
        existingDiv.setAttribute(key, attributes[key]);
      }
    }
    return;
  }

  const div = document.createElement("div");
  div.setAttribute(CUSTOM_CODE_ATTRIBUTE, title);

  if (attributes) {
    for (const key in attributes) {
      div.setAttribute(key, attributes[key]);
    }
  }

  if (location === "footer") {
    document.body.appendChild(div);
  } else {
    document.body.insertBefore(div, document.body.firstChild);
  }

  setInnerHTML(div, content, title);
};

/**
 * Injects a Google Fonts stylesheet link into the document head
 */
export const loadGoogleFonts = (googleFontLink: string) => {
  if (!googleFontLink) return;

  const existingLink = document.querySelector(
    `link[${CUSTOM_CODE_ATTRIBUTE}="${RESOURCE_TITLES.GOOGLE_FONTS}"]`
  ) as HTMLLinkElement;

  if (existingLink) {
    existingLink.href = googleFontLink;
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleFontLink;
  link.setAttribute(CUSTOM_CODE_ATTRIBUTE, RESOURCE_TITLES.GOOGLE_FONTS);
  document.head.appendChild(link);
};

/**
 * Injects custom code (scripts, styles, HTML) from parsed custom code
 * Uses the unified CUSTOM_CODE_ATTRIBUTE to allow replacing server-rendered elements
 */
export const loadCustomCode = (
  parsedCustomCode: Record<
    types.CustomCodeInjectLocation,
    types.ParsedCustomCode
  >
) => {
  if (!parsedCustomCode) return;

  for (const location of Object.keys(
    parsedCustomCode
  ) as types.CustomCodeInjectLocation[]) {
    const parsed = parsedCustomCode[location];

    // Inject custom styles
    for (let i = 0; i < parsed.styles.length; i++) {
      injectStyle(parsed.styles[i].title, parsed.styles[i].content, {
        location,
      });
    }

    // Inject custom scripts
    for (let i = 0; i < parsed.scripts.length; i++) {
      injectScript(parsed.scripts[i].title, parsed.scripts[i].content, {
        location,
      });
    }

    // Inject custom HTML
    for (let i = 0; i < parsed.html.length; i++) {
      injectHTML(parsed.html[i].title, parsed.html[i].content, { location });
    }
  }
};

/**
 * Gathers all resources from a Lexical editor instance
 * This extracts styles, scripts, fonts, and animations from the editor
 */
export const gatherResourcesFromEditor = (editor: LexicalEditor) => {
  // Component styles (main editor + widget styles)
  //const styling = cssToStringFromEditor(editor, { isEditorMode: false });

  let nodeStyles = "";
  let formScript = "";
  let googleFonts = newGoogleFonts();

  const customFonts: string[] = [];
  const allEditors = [editor];
  const cssVariablesSet = new Set<string>();

  walkAllEditors(editor, (nestedEditor) => {
    allEditors.push(nestedEditor);

    nodeStyles += cssToStringFromEditor(nestedEditor, {
      isEditorMode: false,
    });

    nestedEditor.read(() => {
      customFonts.push($getCustomFontCSS());
    });

    nestedEditor.read(() => {
      $walkNode($getRoot(), (node) => {
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
      });
    });
  });

  // walkNodeWithWidgets(
  //   editor,
  //   (nestedEditor, node) => {
  //     //allEditors.push(nestedEditor);

  //     nestedEditor.read(() => {
  //       //customFonts.push($getCustomFontCSS());
  //       if ($isFormNode(node)) {
  //         const submitHandler = node.getSubmitHandler();
  //         if (submitHandler?.jsFunction) {
  //           formScript += `;${submitHandler.jsFunction}`;
  //         }
  //       }

  //       if ($isCSSVariablesNode(node)) {
  //         const cssVariables = node.getData()?.css; // || $getFetchedData(node)?.css;
  //         if (cssVariables) {
  //           cssVariablesSet.add(cssVariables);
  //         }
  //       }
  //     });
  //   },
  //   {
  //     onEditor: (nestedEditor) => {
  //       allEditors.push(nestedEditor);

  //       nodeStyles += cssToStringFromEditor(nestedEditor, {
  //         isEditorMode: false,
  //       });

  //       nestedEditor.read(() => {
  //         customFonts.push($getCustomFontCSS());
  //       });
  //     },
  //   }
  // );

  googleFonts = getGoogleFonts(allEditors);
  const googleFontLink = buildGoogleFontsStyleLink(googleFonts);

  // Animation CSS and JS
  const { js: animationJSArray, css: animationCSSArray } =
    generateKeyframeCSSAndJS(editor);
  const animationStyles = animationCSSArray.join("\n");
  const animationScript = animationJSArray.join("\n");

  const customFontStyles = customFonts.join("");

  const cssVariables = cssVariablesSet.size
    ? Array.from(cssVariablesSet).join("\n")
    : null;

  // Combine all styles (component styles + widget styles + animation keyframes)
  const styles = `${cssVariables || ""} ${animationStyles || ""} ${
    nodeStyles || ""
  }`;

  logger.log( "Gathered resources:", {
    styles,
    nodeStyles,
    animationScript,
    animationStyles,
    formScript,
    googleFontLink,
    customFontStyles,
  });

  return {
    styles,
    animationScript,
    formScript,
    googleFontLink,
    customFontStyles,
  };
};

/**
 * Loads all resources from a Lexical editor instance
 * This is a convenience function that gathers resources from the editor
 * and immediately loads them into the DOM
 */
export const loadResourcesFromEditor = (editor: LexicalEditor) => {
  const resources = gatherResourcesFromEditor(editor);
  loadAllResources(resources);
};

/**
 * Loads all resources from the template result
 * This function can update resources that were initially rendered on the server
 * by using the unified CUSTOM_CODE_ATTRIBUTE and consistent ID generation
 */
export const loadAllResources = (options: {
  googleFontLink?: string | null;
  customFontStyles?: string | null;
  styles?: string | null;
  animationScript?: string | null;
  formScript?: string | null;
  parsedCustomCode?: Record<
    types.CustomCodeInjectLocation,
    types.ParsedCustomCode
  > | null;
}) => {
  const {
    googleFontLink,
    customFontStyles,
    styles,
    animationScript,
    formScript,
    parsedCustomCode,
  } = options;

  // Load Google fonts
  if (googleFontLink) {
    loadGoogleFonts(googleFontLink);
  }

  // Load custom font styles
  if (customFontStyles) {
    injectStyle(RESOURCE_TITLES.CUSTOM_FONTS, customFontStyles);
  }

  // Load component styles
  if (styles) {
    injectStyle(RESOURCE_TITLES.COMPONENT_STYLES, styles);
  }

  // Load animation script
  if (animationScript) {
    injectScript(RESOURCE_TITLES.ANIMATION_SCRIPT, animationScript, {
      runOnDOMReady: true,
    });
  }

  // Load form script
  if (formScript) {
    injectScript(RESOURCE_TITLES.FORM_SCRIPT, formScript, {
      runOnDOMReady: true,
    });
  }

  // Load custom code
  if (parsedCustomCode) {
    loadCustomCode(parsedCustomCode);
  }
};

/**
 * Utility to find and replace server-rendered resources
 * Uses the CUSTOM_CODE_ATTRIBUTE to locate elements
 */
export const findResourceByCustomCode = (title: string): Element | null => {
  return document.querySelector(`[${CUSTOM_CODE_ATTRIBUTE}="${title}"]`);
};

/**
 * Utility to remove all resources with a specific custom code title
 */
export const removeResourceByCustomCode = (title: string): void => {
  const elements = document.querySelectorAll(
    `[${CUSTOM_CODE_ATTRIBUTE}="${title}"]`
  );
  elements.forEach((element) => element.remove());
};
