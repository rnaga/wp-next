/**
 * Shared constants for resource loading
 * These constants are used by both server-side and client-side code
 * to ensure proper coordination when replacing server-rendered resources
 */

/**
 * Data attribute name used to identify custom code elements
 * This allows client-side code to find and replace server-rendered elements
 */
export const CUSTOM_CODE_ATTRIBUTE = "data-custom-code";

/**
 * Resource titles used as values for CUSTOM_CODE_ATTRIBUTE
 * These are used to identify and replace resources on both server and client
 */
export const RESOURCE_TITLES = {
  GOOGLE_FONTS: "google-fonts",
  CUSTOM_FONTS: "custom-fonts",
  COMPONENT_STYLES: "component-styles",
  ANIMATION_SCRIPT: "animation-script",
  FORM_SCRIPT: "form-script",
  CACHED_DATA: "cached-data",
  TEMPLATE_ID: "template-id",
  ROOT_DIV_ID: "root-div-id",
  EDIT_STATE_JSON: "editor-state-json",
  CSS_VARIABLES: "css-variables",
} as const;

/**
 * ID prefixes for different resource types
 * These ensure unique IDs and easy identification of resource types
 * @deprecated Use RESOURCE_TITLES instead for consistency between client and server
 */
export const RESOURCE_ID_PREFIXES = {
  CUSTOM_STYLE: "__custom-style",
  CUSTOM_SCRIPT: "__custom-script",
  CUSTOM_HTML: "__custom-html",
  GOOGLE_FONT: "__google-font-style-link",
  CUSTOM_FONTS: "__custom-fonts-style",
  COMPONENT_STYLES: "__component-styles",
  ANIMATION_SCRIPT: "__animation-script",
  FORM_SCRIPT: "__form-script",
  EDIT_STATE_JSON: "__editor-state-json",
  CSS_VARIABLES: "__css-variables",
} as const;

/**
 * Map of HTML attribute names to their React JSX prop equivalents
 */
export const HTML_TO_JSX: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  cellspacing: "cellSpacing",
  cellpadding: "cellPadding",
  rowspan: "rowSpan",
  colspan: "colSpan",
  usemap: "useMap",
  frameborder: "frameBorder",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  enctype: "encType",
  accesskey: "accessKey",
  inputmode: "inputMode",
};

/**
 * Generate a unique ID for a custom code resource
 */
export const generateCustomCodeId = (
  type: keyof Pick<
    typeof RESOURCE_ID_PREFIXES,
    "CUSTOM_STYLE" | "CUSTOM_SCRIPT" | "CUSTOM_HTML"
  >,
  title: string,
  index: number
): string => {
  return `${RESOURCE_ID_PREFIXES[type]}-${title}-${index}`;
};
