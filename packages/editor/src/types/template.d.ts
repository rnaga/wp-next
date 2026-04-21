import type * as wpTypes from "@rnaga/wp-node/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import * as actionsTemplate from "../server/actions/template";
import * as vals from "../validators";
import { z } from "zod";

import type { FetchedDataMapping } from "./data";
import type { CustomCodeList, CustomCodes } from "./custom-code";
import type { InjectLocation } from "../lexical/nodes/custom-code/CustomCodeNode";

export type Template = NonNullable<
  Awaited<ReturnType<typeof actionsTemplate.get>>
>["data"];

export type Templates = NonNullable<
  Awaited<ReturnType<typeof actionsTemplate.list>>["data"]
>;

export type PostWithCollection = Templates[number] & {
  isCollection: boolean;
  children?: Templates;
};

export type ModalTemplate = Template | Templates[number];

export type TemplateInfo = NonNullable<
  Awaited<ReturnType<typeof actionsTemplate.get>>
>["info"];

export type TemplateSelect = Pick<
  Template,
  "ID" | "post_title" | "post_name" | "post_status" | "template_config"
>;

export type TemplateModalMode = "update" | "json";

export type TemplatePipeFunction = {
  sampleParam: undefined | Record<string, string | number | boolean>;
  fn: (value: string, params: any) => string;
};

export type TemplatePreviewInfo = {
  metaId: number;
  metaKey: string;
  metaValue: {
    createdAt: string;
    createdBy: string;
    description?: string;
    published?: boolean;
  };
};

export type SelectedTemplatePreview = {
  editorStateString: string;
  editorStateKey: string;
  previewInfo: TemplatePreviewInfo;
};

export type TemplatePreviewInfoList = TemplatePreviewInfo[];

export type PreloadedTemplateMapping = {
  template: Template;
  editorStateString: string;
  widgetEditorState: Record<string, string>; // Record<slug, string>
  fetchedData: FetchedDataMapping;
  customCodes: Record<InjectLocation, CustomCodeList>;
};

export type ProcessAndGetTemplateResult =
  | {
      valid: false;
    }
  | {
      valid: true;
      styles: string;
      cssVariables: string;
      customFontStyles: string;
      googleFonts: types.GoogleFonts;
      googleFontLink: string | null;
      customFonts: string[];
      // This can be used with CustomCodeInjector
      parsedCustomCode: Record<
        types.CustomCodeInjectLocation,
        types.ParsedCustomCode
      >;
      widgetSlugs: string[];
      editorStateString: string;
      template: types.Template;
      preload: types.PreloadedTemplateMapping;
      animationScript: string;
      formScript: string;
    };

export type ConfigurableNodeItem = {
  nodeType: string;
  name: string;
  queryKeys: string[];
};

export type TemplatePageMeta = {
  title: string;
  description: string;
} & Record<string, any>;

export type TemplateConfig = {
  /**
   * Maps URL query parameter names to their target Lexical node and query property.
   *
   * Structure: { [urlParamName: string]: { nodeType: string; name: string; queryKey: string } }
   *
   * - **Key (urlParamName)**: The URL query parameter name to watch for in the page URL
   *   Example: In URL "?page=1&category=tech", the keys would be "page" and "category"
   *
   * - **nodeType**: The Lexical node type identifier
   *   - Corresponds to the return value of the static getType() method on the Lexical node class
   *   - Example: For DataFetchingNode subclasses, this might be "post-data", "user-data", etc.
   *   - Used to identify which type of node should handle this parameter
   *
   * - **name**: The secondary name/identifier of the specific node instance
   *   - For DataFetchingNode: matches the private #name property (accessed via getName()/setName())
   *   - Also serves as the first-level key in URLQueryCacheData: Record<name, Record<string, any>>
   *   - Identifies which specific node instance of the given nodeType should receive this URL parameter
   *   - Example: If nodeType="post-data" and name="posts", it targets the "posts" instance of post-data nodes
   *
   * - **queryKey**: The property name in the node's __query object where the value is stored
   *   - The URL parameter value gets mapped to this field in the node's __query
   *   - This query field is then used when the node fetches data from the server
   *   - Security (DataFetchingNode): Must be listed in the node's __allowedQueryPassthroughKeys to be accepted
   *
   * @example
   * // URL: /blog?page=1
   * // DataFetchingNode with getType()="post-data", #name="posts", __query={ page: 1 }
   * queryMapping: {
   *   page: [{ nodeType: "post-data", name: "posts", queryKey: "page" }]
   * }
   * // Flow: URL param "page=1" → Node type "post-data" with name "posts" → __query.page = 1 → server fetch
   *
   * @example
   * // URL: ?slug=hello-world
   * // Routes the same query param to both post-data and comment-data nodes (1:many)
   * queryMapping: {
   *   slug: [
   *     { nodeType: "post-data", name: "post", queryKey: "slug" },
   *     { nodeType: "comment-data", name: "comments", queryKey: "post_slug" }
   *   ]
   * }
   * // Flow: URL param "slug=hello-world" → Both nodes receive the value
   * // Result: { "post": { slug: "hello-world" }, "comments": { post_slug: "hello-world" } }
   */
  queryMapping: Record<string, z.infer<typeof vals.template.configItem>[]>;
  /**
   * Maps URL path segments to their target Lexical nodes and query properties.
   * Supports 1:many relationships where a single path segment can route to multiple nodes.
   *
   * Structure: Array of arrays, where each inner array maps a single path segment
   * to one or more { nodeType: string; name: string; queryKey: string } configurations.
   *
   * - **Outer array index**: Corresponds to the position of path segments in the URL
   *   Example: URL "/hello-world/" → pathMapping[0] maps "hello-world"
   *
   * - **Inner array**: Contains one or more mapping configurations for the same path segment
   *   This enables 1:many relationships where a single URL segment can route to multiple nodes
   *   Example: pathMapping[0] = [{post config}, {comment config}] routes "hello-world" to both
   *
   * - **nodeType**: The Lexical node type identifier (from static getType() method)
   * - **name**: The node instance name (matches DataFetchingNode #name property)
   * - **queryKey**: The property name in the node's __query object
   *
   * @example
   * // URL: /hello-world/
   * // Routes the same slug to both post-data and comment-data nodes
   * pathMapping: [
   *   [
   *     { nodeType: "post-data", name: "post", queryKey: "slug" },
   *     { nodeType: "comment-data", name: "comments", queryKey: "post_slug" }
   *   ]
   * ]
   * // Flow: Path segment "hello-world" → Both nodes receive the value
   * // Result: { "post": { slug: "hello-world" }, "comments": { post_slug: "hello-world" } }
   *
   * @example
   * // URL: /tech/my-article/
   * // First segment: single mapping, Second segment: multiple mappings
   * pathMapping: [
   *   [{ nodeType: "category-data", name: "category", queryKey: "slug" }],
   *   [
   *     { nodeType: "post-data", name: "post", queryKey: "slug" },
   *     { nodeType: "related-data", name: "related", queryKey: "post_slug" }
   *   ]
   * ]
   */
  pathMapping: z.infer<typeof vals.template.configItem>[][];

  // When true, the template is widget-only (no content nodes) and will not be
  // accessible directly via slug or slug alias.
  //
  // NOTE: This field is NOT persisted as part of the _template_config JSON meta.
  // While MySQL and MariaDB support JSON path queries, storing this flag in its
  // own post meta key (TEMPLATE_META_CONFIG_USE_WIDGET_ONLY_KEY) is the safer
  // route for now — it avoids reliance on JSON function support across DB versions
  // and keeps the query simple and index-friendly.
  // The server action merges it back into this shape when returning TemplateConfig.
  useWidgetOnly?: boolean;

  /**
   * Defines typed variables that can be passed into this template when it is used as a widget.
   *
   * Structure: { [variantName: string]: [dataType, defaultValue] }
   *   - dataType:     "string" | "number" | "boolean"
   *   - defaultValue: the fallback value used when no value is set on a widget instance.
   *                   null means no default is defined.
   *                   NOTE: boolean variants do not support a default value — defaultValue
   *                   is always null for boolean and is ignored during processing. A boolean
   *                   variant resolves only from what is explicitly stored on the WidgetNode
   *                   (true if checked, absent/false otherwise).
   *
   * --- AUTHORING (SettingsModal) ---
   * Variant definitions (name, data type, and optional default value) are configured in the
   * Template Settings modal (SettingsModal.tsx → Widget Variants section). They are persisted
   * as part of the _template_config JSON meta on the template post.
   * Boolean variants do not expose a default value input in the modal.
   *
   * --- VALUES (WidgetRightPanelForm) ---
   * When a template is selected as a widget (WidgetRightPanelForm.tsx), the editor reads
   * the target template's widgetVariants and renders one input per variant:
   *   - "string"  → text input (clearable; empty removes the stored value so the default applies)
   *   - "number"  → number input (clearable; empty removes the stored value so the default applies)
   *   - "boolean" → checkbox (checked = true stored on node; unchecked = key removed from node,
   *                 resolves to false at runtime since no default is applied for boolean)
   * For string and number, if no value is set on the widget instance, its defaultValue (if
   * non-null) is used to pre-populate the input. The entered values are stored on the WidgetNode
   * as `widgetVariantValues` and serialised with the editor state
   * (SerializedWidgetNode.widgetVariantValues).
   *
   * --- RUNTIME RESOLUTION ---
   * When a widget is processed (processWidget / processAllWidgets in WidgetNode.tsx), the
   * variant values are injected into the nested editor's data cache under the key
   * "%variant" via `$storeFetchedData("%variant", widgetVariantValues)`.
   *
   * Template text nodes inside the widget template can then reference any variant with
   * the syntax:
   *
   *   ${%variant.variantName}
   *
   * `$processTemplateText` resolves this by calling `$getFetchedData("%variant")` and
   * traversing the dot-separated key path — exactly the same mechanism used for data-
   * fetching node variables (e.g. ${posts.title}).
   *
   * --- DYNAMIC ATTRIBUTES ---
   * Variant keys are also available as condition keys in the Dynamic Attributes condition
   * builder (ConditionTab.tsx), allowing rules like:
   *   ${%variant.variantName}  equals  "someValue"
   * The operator set offered in the UI is determined by the variant's declared data type.
   *
   * --- DataInputEndDecorator ---
   * Variant keys appear in the variable-picker menu (DataInputEndDecorator.tsx) alongside
   * data-fetching keys, so authors can insert them into template text nodes without typing
   * the syntax manually.
   */
  widgetVariants?: WidgetVariants;
};

export type WidgetVariants = Record<
  string,
  ["string" | "number" | "boolean", string | number | boolean | null]
>;
