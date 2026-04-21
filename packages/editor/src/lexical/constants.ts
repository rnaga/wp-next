// CSS editor config keys — used in CSS.__editorConfig for per-node debug/editor state
export const CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES =
  "disableExternalClassNames";

// When true, the node is hidden (display: none) in preview/fullscreen preview modes only.
// Applied as an inline style on the iframe DOM element — never affects production rendering.
export const CSS_EDITOR_MODE_CONFIG_HIDDEN = "hidden";

// DynamicAttributes editor config keys — used in DynamicAttributes.__editorConfig for
// per-node ephemeral editor state (client-side only, never persisted).

// When true, dynamic attribute condition rules are not applied during preview rendering.
// Useful for previewing the "base" appearance of a node without dynamic overrides.
export const DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN = "hidden";

export const TEMPLATE_POST_TYPE = "next-template";
export const TEMPLATE_COLLECTION_POST_TYPE = "next-template-col";

export const TEMPLATE_META_PREVIEW_CONTENT_KEY_PREFIX = "_preview_content";
export const TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX = "_preview_info";

export const TEMPLATE_META_PREVIEW_CONTENT_SAVE_KEY_PREFIX = `${TEMPLATE_META_PREVIEW_CONTENT_KEY_PREFIX}_save`;
export const TEMPLATE_META_PREVIEW_INFO_SAVE_KEY_PREFIX = `${TEMPLATE_META_PREVIEW_INFO_KEY_PREFIX}_save`;

export const TEMPLATE_META_CONFIG_KEY = "_template_config";

export const TEMPLATE_META_PAGE_META_KEY = "_template_page_meta";

export const TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY =
  "_template_use_widget_only";

export const DEFAULT_TEMPLATE_JSON_STRING_CONTENT =
  '{"root":{"children":[{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"wrapper","version":1}],"direction":null,"format":"","indent":0,"type":"body","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

export const TEMPLATE_DEFAULT_CONFIG = {
  pathMapping: [],
  queryMapping: {},
};

export const TEMPLATE_SLUG_HOMEPAGE = "home";

export const TEMPLATE_ERROR_STATUS_TYPES = [
  "NOT_FOUND", // 404 - The requested page/template was not found, or the provided identifier is not valid
  "TEMPLATE_ERROR", // 500 - Template processing failed
  "UNKNOWN_ERROR", // 500 - An unexpected error occurred during template processing
] as const;

export const TEMPLATE_SLUGS_FORBIDDEN = [
  "admin", // Reserved for WordPress admin dashboard
  "api", // Commonly reserved for API routes
  "auth",
  "uploads", // Reserved for the static uploads directory served from public/uploads/
  "files", // Reserved for the static files directory served from public/files/
  "favicon.ico", // Well-known file browsers request automatically; passes slug validation but must not be a template
]; // Reserved slugs that should not be used for page templates to prevent conflicts with admin routes, API endpoints, or public static asset directories.

export const TEMPLATE_SLUGS_ERROR = [
  "error", // Generic error page
  "error-unknown", // Template slug for unknown errors
  "error-template", // Template slug for template processing errors
  "error-not-found", // 404 page template slug
];

export const TEMPLATE_SLUGS_RESERVED = [...TEMPLATE_SLUGS_ERROR];
