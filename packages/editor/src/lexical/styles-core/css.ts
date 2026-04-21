import {
  $getEditor,
  $getNodeByKey,
  $getRoot,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from "lexical";
import { CSSProperties } from "react";

import { NODE_PROPERTY_UPDATED } from "../../client/node-event/commands";
import {
  NODE_CSS_UPDATED_COMMAND,
  NODE_EDITOR_CSS_UPDATED_COMMAND,
} from "../commands";
import { CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES } from "../constants";
import { isEditorMode } from "../editor-mode";
import { getStyle } from "./get-style";
import { setStyle } from "./set-style";
import { stylesToString } from "./styles-to-string";
import { $walkNode } from "../walk-node";
import {
  BREAKPOINTS,
  CSS_CUSTOM_PROPERTIES_KEY,
  CSS_DEFAULT_DEVICE,
  CSS_EXTERNAL_CLASS_NAMES_KEY,
  DEFAULT_STYLES,
  STYLE_DEVICES,
} from "./constants";
import { decodeCustomProperties } from "../styles/custom-properties";
import { CSSDevice } from "./css-device";
import { CSSEditorElementState } from "./css-editor-element-state";

import type * as types from "../../types";
import type { SerializedWPNode, WPLexicalNode } from "../nodes/wp/types";
import { deferredWalkNodeWithWidgets } from "../deferred";
import { isServerSide } from "../environment";

// Lazy load $isWPLexicalNode to avoid circular dependency
// This function is imported from wp/index.ts only when needed
let $isWPLexicalNode: ((node: any) => node is WPLexicalNode) | null = null;

// `get$...` means "getter for a `$...` Lexical helper".
// Usage is intentionally two-step: `get$isWPLexicalNode()(node)`.
const get$isWPLexicalNode = (): ((node: unknown) => node is WPLexicalNode) => {
  if (!$isWPLexicalNode) {
    // Dynamic import to break circular dependency
    $isWPLexicalNode = require("../nodes/wp/index").$isWPLexicalNode;
  }
  return $isWPLexicalNode!; // Non-null assertion since we just assigned it
};

export const EDITOR_MODE_CSS_CLASS_NAME = "__editor_";

export class CSS {
  // Unique class name for the style
  __className: string = `p${Math.random().toString(36).substring(7)}`;

  // Node Key associated with this style
  __nodeKey: NodeKey;

  // className in editor mode
  __classNameEditor: string = `${EDITOR_MODE_CSS_CLASS_NAME}${Math.random()
    .toString(36)
    .substring(7)}`;

  // className for debugging in editor mode - properties are not serializable.
  __debugClassNameEditor: string = `${EDITOR_MODE_CSS_CLASS_NAME}debug_${Math.random()
    .toString(36)
    .substring(7)}`;

  // Set of external class names
  [CSS_EXTERNAL_CLASS_NAMES_KEY]: string = "";

  // Unique key for the style
  __key: string = `p${Math.random().toString(36).substring(7)}`;
  // Styles for different breakpoint devices
  __styles: types.CSSRecord = {
    ...DEFAULT_STYLES,
  };

  // Styles for different CSS states (hover, active, etc.) - new structure: state first, then devices
  __stylesStates: types.CSSStatesRecord = {};

  __stylesEditor: types.CSSEditor = {};

  __stylesEditorDebug: types.CSSEditor = {};

  // Per-node editor config — ephemeral debug/editor state, not persisted in exportJSON.
  // CLIENT-SIDE ONLY: values are only ever set on the client. On the server this
  // object is always empty, so reads always return undefined server-side.
  private __editorConfig: Record<
    string,
    string | number | boolean | undefined
  > = {};

  // History of styles for undo functionality
  __history: Array<typeof this.__styles> = [];

  constructor(nodeKey: NodeKey) {
    this.__nodeKey = nodeKey;
  }

  // Push current styles to history
  pushHistory() {
    this.__history.push({ ...this.__styles });
  }

  // Pop the last styles from history
  popHistory() {
    if (this.__history.length > 0) {
      this.__styles = this.__history.pop()!;
    }
  }

  // Check if there is any history
  hasHistory() {
    return this.__history.length > 0;
  }

  // Get the unique class name
  getClassName() {
    return this.__className;
  }

  static generateClassName() {
    return `p${Math.random().toString(36).substring(7)}`;
  }

  setClassName(name?: string) {
    this.__className = name ?? CSS.generateClassName();
  }

  resetClassName() {
    this.setClassName();
  }

  // Set external class names
  setExternalClassNames(classNames: string) {
    this[CSS_EXTERNAL_CLASS_NAMES_KEY] =
      `${this[CSS_EXTERNAL_CLASS_NAMES_KEY]} ${classNames}`.trim();
  }

  /**
   * Sets a per-node editor config value.
   * CLIENT-SIDE ONLY — throws if called on the server.
   */
  setEditorModeConfig(key: string, value: string | number | boolean): void {
    if (isServerSide()) {
      throw new Error(
        "CSS.setEditorModeConfig() must only be called on the client side."
      );
    }
    this.__editorConfig[key] = value;
  }

  getAllEditorModeConfig() {
    return this.__editorConfig;
  }

  /**
   * Merges multiple per-node editor config values at once.
   * CLIENT-SIDE ONLY — throws if called on the server.
   */
  mergeEditorModeConfig(config: Partial<typeof this.__editorConfig>): void {
    if (isServerSide()) {
      throw new Error(
        "CSS.mergeEditorModeConfig() must only be called on the client side."
      );
    }

    //this.__editorConfig = {};

    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || value === null) {
        delete this.__editorConfig[key];
      } else {
        this.__editorConfig[key] = value;
      }
    }
  }

  /**
   * @deprecated Use mergeEditorModeConfig().
   */
  setEditorModeConfigInJSON(config: typeof this.__editorConfig): void {
    this.mergeEditorModeConfig(config);
  }

  /**
   * Gets a per-node editor config value.
   * Safe to call on the server — always returns undefined server-side because
   * __editorConfig is never populated there.
   */
  getEditorModeConfig(key: string): string | number | boolean | undefined {
    return this.__editorConfig[key];
  }

  // Get all class names as a single string.
  // When CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES is set in __editorConfig,
  // external classnames are omitted — useful for debugging external styling
  // frameworks (e.g. Tailwind). Always includes all classnames on the server.
  getAllClassNames() {
    if (this.__editorConfig[CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES]) {
      return this.__className;
    }
    return `${this.__className} ${this[CSS_EXTERNAL_CLASS_NAMES_KEY]}`.trim();
  }

  setDefault(css: types.CSSKeyValue) {
    const defaultCSS = this.__styles[CSS_DEFAULT_DEVICE];
    this.__styles[CSS_DEFAULT_DEVICE] = {
      ...defaultCSS,
      ...css,
    };
  }

  #setIfEmpty = (css: types.CSSKeyValue, device: types.BreakpointDevice) => {
    const prevCss = this.__styles[device];

    for (const key in css) {
      if (prevCss && prevCss[key as any] !== undefined) {
        continue;
      }

      this.set(css, device);
    }
  };

  // Set styles only if they are empty - i.e. don't override existing styles
  setIfEmpty(css: types.CSSKeyValue) {
    this.#setIfEmpty(css, CSSDevice.__current);
  }

  setDefaultIfEmpty(css: types.CSSKeyValue) {
    this.#setIfEmpty(css, CSS_DEFAULT_DEVICE);
  }

  setEditorStyles(css: types.CSSEditor) {
    this.__stylesEditor = {
      ...this.__stylesEditor,
      ...css,
    };
  }

  getEditorStyles(): types.CSSEditor {
    return this.__stylesEditor;
  }

  setDebugEditorStyles(css: CSSProperties) {
    this.__stylesEditorDebug = {
      ...this.__stylesEditorDebug,
      ...css,
    };
  }

  unsetDebugEditorStyles(keys: string[]) {
    for (const key of keys) {
      delete this.__stylesEditorDebug[key as keyof types.CSSEditor];
    }
  }

  getDebugEditorStyles(): types.CSSEditor {
    return this.__stylesEditorDebug;
  }

  getEditorClassName() {
    return this.__classNameEditor;
  }

  getDebugEditorClassName() {
    return this.__debugClassNameEditor;
  }

  set(
    css: types.CSSKeyValue,
    device?: types.BreakpointDevice,
    state?: types.CSSState
  ) {
    setStyle(this, css, {
      device,
      state,
    });
  }

  // Check if the styles are empty
  isEmpty() {
    return Object.values(this.__styles).every(
      (style) => !style || Object.keys(style).length === 0
    );
  }

  // Clear the styles and push current styles to history
  clear() {
    if (!this.isEmpty()) {
      this.pushHistory();
      this.__styles = { ...DEFAULT_STYLES };
    }
  }

  // Restore the last styles from history
  restore() {
    this.popHistory();
  }

  exists(key: string, subKey?: string): boolean {
    const innerFn = (
      key: string,
      nestedStyles: Record<string, any>
    ): boolean => {
      if (
        (key.startsWith("__") || key.startsWith("%")) &&
        key !== "__cssVariablesUsage"
      ) {
        return innerFn(key, nestedStyles[key]);
      }

      return subKey
        ? nestedStyles[key] && subKey in nestedStyles[key]
        : key in nestedStyles;
    };

    const currentDevice = CSSDevice.__current;
    const currentState = CSSEditorElementState.getCurrent(this.__nodeKey);

    const style =
      currentState !== "none"
        ? this.__stylesStates[currentState]?.[currentDevice]
        : this.__styles[currentDevice];
    return innerFn(key, style || {});
  }

  currentState() {
    return CSSEditorElementState.getCurrent(this.__nodeKey);
  }

  targetStyles = (
    args?: Partial<{
      device: types.BreakpointDevice;
      state: types.CSSState;
    }>
  ): types.CSSKeyValue => {
    const device = args?.device ?? CSSDevice.__current;
    const state = args?.state ?? this.currentState();

    const targetStyle: types.CSSKeyValue =
      state === "none"
        ? (this.__styles[device] ?? {})
        : (this.__stylesStates?.[state]?.[device] ?? {});

    return targetStyle;
  };

  get(options?: {
    device?: types.BreakpointDevice;
    state?: types.CSSState;
    mode?: "toString" | "toObject";
  }): types.CSSKeyValue {
    return getStyle(this, options);
  }

  remove(propertyNames: string[]) {
    let css = this.get() as Record<string, any>;
    for (const propertyName of propertyNames) {
      // Set value to undefined so that it can be removed in set method
      css[propertyName] = undefined;
    }

    this.set(css);
  }

  removeFromAllDevices(propertyNames: string[]) {
    for (const device of Object.keys(
      DEFAULT_STYLES
    ) as types.BreakpointDevice[]) {
      CSSDevice.setDevice(device);
      this.remove(propertyNames);
      CSSDevice.restoreDevice();
    }
  }

  toString(args?: {
    className?: string;
    excludeCSSKeys?: Array<keyof types.CSSKeyValue>;
  }): string {
    const { className = this.__className, excludeCSSKeys } = args || {};

    // const mergeStateStyles = elementState !== "none" && isEditorMode();

    const targetDevice = !isEditorMode() ? "desktop" : CSSDevice.__current;

    const targetState = !isEditorMode()
      ? "none"
      : CSSEditorElementState.getCurrent(this.__nodeKey);

    const stylesString = stylesToString<false>(this, {
      targetDevice,
      targetState,
      className,
      excludeCSSKeys,
    });

    return stylesString;
  }

  customPropertyToString(): string {
    const className = this.getClassName();
    const css = this.get();

    const elementState = CSSEditorElementState.getCurrent(this.__nodeKey);

    const rawCustomProperties = css?.[CSS_CUSTOM_PROPERTIES_KEY];
    const parsed =
      typeof rawCustomProperties === "string"
        ? decodeCustomProperties(rawCustomProperties)
        : typeof rawCustomProperties === "object" && rawCustomProperties?.$value
          ? typeof rawCustomProperties.$value === "string"
            ? decodeCustomProperties(rawCustomProperties.$value)
            : rawCustomProperties.$value
          : {};

    const cssPropertiesString = Object.entries(parsed)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" ");

    // Return class name block with CSS properties
    let cssString = `.${className} { ${cssPropertiesString} }`;

    if (elementState && elementState !== "none") {
      cssString = ` .${className}:${elementState} { ${cssPropertiesString} }`;
    }

    return cssString;
  }

  // Clone the current style
  static clone(node: WPLexicalNode) {
    const prevStyle = node.__css;
    const newStyle = new CSS(node.getKey());
    newStyle.__className = prevStyle?.__className ?? CSS.generateClassName();
    newStyle[CSS_EXTERNAL_CLASS_NAMES_KEY] =
      prevStyle?.[CSS_EXTERNAL_CLASS_NAMES_KEY] ?? "";

    newStyle.__styles = { ...prevStyle.__styles };
    newStyle.__stylesStates = structuredClone(prevStyle.__stylesStates);

    newStyle.__classNameEditor = prevStyle.__classNameEditor;
    newStyle.__stylesEditor = { ...prevStyle.__stylesEditor };

    newStyle.__editorConfig = { ...prevStyle.__editorConfig };

    newStyle.__debugClassNameEditor = prevStyle.__debugClassNameEditor;
    newStyle.__stylesEditorDebug = { ...prevStyle.__stylesEditorDebug };
    return newStyle;
  }

  private prependEditorClassName(
    element: HTMLElement,
    node: WPLexicalNode,
    config: EditorConfig
  ) {
    if (node.isEditorMode(config)) {
      element.className = `${this.__classNameEditor} ${this.__debugClassNameEditor} ${element.className}`;
    }
  }

  updateDOM(
    node: LexicalNode,
    prevNode: LexicalNode,
    element: HTMLElement,
    config: EditorConfig
  ) {
    if (!prevNode || !hasCSS(node) || !hasCSS(prevNode)) {
      return;
    }

    const prevClassName = prevNode.__css.getAllClassNames();
    const currentClassName = node.__css.getAllClassNames();

    if (prevClassName !== currentClassName) {
      element.className = currentClassName;
      this.prependEditorClassName(element, node as WPLexicalNode, config);
    }
  }

  createDOM(node: LexicalNode, element: HTMLElement, config: EditorConfig) {
    if (!get$isWPLexicalNode()(node)) {
      return;
    }

    element.className = this.getAllClassNames();
    this.prependEditorClassName(element, node, config);
  }

  // Import styles from a JSON object
  static importJSON(node: WPLexicalNode, serialized: SerializedWPNode): CSS {
    const style = new CSS(node.getKey());
    if (!serialized) return style;

    style.__className =
      serialized?.__css?.__className ?? CSS.generateClassName();
    const rawExternalClassNames =
      serialized?.__css?.[CSS_EXTERNAL_CLASS_NAMES_KEY] ?? "";
    style[CSS_EXTERNAL_CLASS_NAMES_KEY] = Array.isArray(rawExternalClassNames)
      ? rawExternalClassNames.join(" ")
      : rawExternalClassNames;

    // new Set(
    //   serialized?.__css?.[CSS_EXTERNAL_CLASS_NAMES_KEY]?.split(" ") ?? []
    // );
    style.__styles = serialized?.__css?.__styles ?? {
      desktop: undefined,
      tablet: undefined,
      mobile: undefined,
    };
    style.__stylesStates = serialized?.__css?.__stylesStates ?? {};
    style.__classNameEditor =
      serialized?.__css?.__classNameEditor ??
      `${EDITOR_MODE_CSS_CLASS_NAME}${Math.random().toString(36).substring(7)}`;

    style.__stylesEditor = serialized?.__css?.__stylesEditor ?? {};

    style.__debugClassNameEditor =
      serialized?.__css?.__debugClassNameEditor ??
      `${EDITOR_MODE_CSS_CLASS_NAME}debug_${Math.random().toString(36).substring(7)}`;

    return style;
  }

  // Export styles to a JSON object
  exportJSON() {
    return {
      __className: this.__className,
      // this[CSS_EXTERNAL_CLASS_NAMES_KEY] can be either a string or an array of strings,
      // so we normalize it to a string
      [CSS_EXTERNAL_CLASS_NAMES_KEY]: Array.isArray(
        this[CSS_EXTERNAL_CLASS_NAMES_KEY]
      )
        ? (this[CSS_EXTERNAL_CLASS_NAMES_KEY] as unknown as string[])
            .join(" ")
            .trim()
        : this[CSS_EXTERNAL_CLASS_NAMES_KEY]?.trim(),
      __styles: this.__styles,
      __stylesStates: this.__stylesStates,
      __classNameEditor: this.__classNameEditor,
      __debugClassNameEditor: this.__debugClassNameEditor,
      __stylesEditor: this.__stylesEditor,
    };
  }
}

export const $getMappedCSSEditorModeConfig = () => {
  let mappedConfig: Record<
    string,
    Record<string, string | number | boolean | undefined>
  > = {};
  deferredWalkNodeWithWidgets($getEditor(), (nestedEditor, node) => {
    nestedEditor.read(() => {
      if (get$isWPLexicalNode()(node)) {
        const className = node.__css.getDebugEditorClassName();
        const editorConfig = node.__css.getAllEditorModeConfig();

        // Only include nodes that have editor config values set
        // (i.e. skip nodes with empty editor config)
        if (Object.keys(editorConfig).length === 0) {
          return;
        }

        mappedConfig = {
          ...mappedConfig,
          [className]: editorConfig,
        };
      }
    });
  });

  return mappedConfig;
};

// Check if a node has advanced style
export const hasCSS = (node: unknown): node is { __css: CSS } => {
  return !!(node as any)?.__css && (node as any).__css instanceof CSS;
};

export const $updateCSS = (args: {
  editor: LexicalEditor;
  node: LexicalNode | undefined | null;
  styles: Record<string, any>;
  setToDefaultDevice?: boolean;
  elementState?: types.CSSState;
  type?: "mouse" | "input";
}) => {
  const {
    editor,
    node,
    styles,
    setToDefaultDevice = false,
    type,
    //elementState,
  } = args;

  if (!get$isWPLexicalNode()(node)) {
    return;
  }

  const elementState =
    args.elementState ?? CSSEditorElementState.getCurrent(node.getKey());

  const writable = node.getWritable() as WPLexicalNode;
  writable.__css.set(
    styles,
    setToDefaultDevice ? CSS_DEFAULT_DEVICE : undefined,
    elementState
  );

  // writable.__css.set(
  //   { backgroundColor: "transparent" },
  //   setToDefaultDevice ? CSS_DEFAULT_DEVICE : undefined,
  //   "hover"
  // );

  // Synchronize styles across nodes
  $syncCSS(writable);

  editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
    node: writable,
    type: type ?? "input",
  });

  editor.dispatchCommand(NODE_CSS_UPDATED_COMMAND, {
    node: writable,
    styles,
    type: type ?? "input",
  });
};

// export const $walkCSS = (
//   node: LexicalNode | undefined | null,
//   callback: (key: string, value: any) => void,
//   options?: { exclude?: string[] }
// ) => {
//   const { exclude } = options ?? {};

//   if (!hasCSS(node)) return;

//   const css = node.__css.get();

//   const innerFn = (css: types.CSSKeyValue) => {
//     // skip if key starts $
//     // if key starts with __, then it's a nested style
//     for (const key in css) {
//       const value = css[key as keyof types.CSSKeyValue];
//       if (key.startsWith("$") || exclude?.includes(key)) {
//         continue;
//       }
//       if (key.startsWith("__")) {
//         typeof value === "object" && innerFn(value);
//         continue;
//       }

//       callback(key, value);
//     }
//   };

//   if (typeof css === "object") {
//     innerFn(css);
//   }
// };

export const $removeCSSValue = (
  editor: LexicalEditor,
  node: WPLexicalNode,
  key: keyof CSSProperties
) => {
  const latestNode = node.getLatest();
  const css = latestNode.__css.get();

  // Mark the key as undefined - this will be removed when calling $updateCSS
  css[key as keyof types.CSSKeyValue] = undefined;

  // Loop through key starting with __
  const nestedKeys = Object.keys(css).filter((k) =>
    k.startsWith("__")
  ) as `__${string}`[];

  for (const nestedKey of nestedKeys) {
    if (css[nestedKey][key]) {
      css[nestedKey][key] = undefined;
    }
  }

  $updateCSS({
    editor,
    node: latestNode,
    styles: css,
  });
};

// export const $getCSSValue = <T = any>(
//   node: LexicalNode,
//   key: keyof CSSProperties | `$${string}`
// ): T | undefined => {
//   if (!get$isWPLexicalNode()(node)) return undefined;

//   const latestNode = node.getLatest();
//   let cssValue: any = undefined;

//   $walkCSS(
//     latestNode,
//     (k, value) => {
//       if (!cssValue && key === k) {
//         cssValue = value;
//       }
//     },
//     { exclude: [CSS_EXTERNAL_CLASS_NAMES_KEY, "__cssVariablesUsage"] }
//   );

//   return !cssValue ? undefined : (cssValue as T);
// };

// export const isCSSKey = (key: string): key is keyof CSSProperties => {
//   return !key.startsWith("$") && key.startsWith("--") && key.length > 2;
// };

// export const $hasCSSValue = (node: LexicalNode, keys: string[]) => {
//   if (!get$isWPLexicalNode()(node)) return false;

//   const latestNode = node.getLatest();

//   return keys.some((key) => isCSSKey(key) && !!$getCSSValue(latestNode, key));
// };

// Utility function to check if a child node should be synced
const shouldSyncCSSNode = (
  childNode: LexicalNode,
  className: string,
  key: string
): childNode is WPLexicalNode => {
  return (
    hasCSS(childNode) &&
    childNode.__css.getClassName() === className &&
    childNode.__css.__key !== key &&
    get$isWPLexicalNode()(childNode)
  );
};

// Synchronize styles across nodes
export const $syncCSS = (node: LexicalNode) => {
  if (!get$isWPLexicalNode()(node)) return;

  const nodeToSync = node as WPLexicalNode;
  const style = nodeToSync.__css;
  const className = style.getClassName();
  const key = style.__key;

  $walkNode($getRoot(), (childNode) => {
    if (shouldSyncCSSNode(childNode, className, key)) {
      const writable = childNode.getWritable();
      writable.__css = CSS.clone(nodeToSync);
    }
  });
};

export const $updateCSSClassName = (node: LexicalNode, className: string) => {
  if (!get$isWPLexicalNode()(node)) return;

  const nodeToSync = node as WPLexicalNode;
  const style = nodeToSync.__css;
  const key = style.__key;

  $walkNode($getRoot(), (childNode) => {
    if (shouldSyncCSSNode(childNode, className, key)) {
      const writable = childNode.getWritable();
      writable.__css = CSS.clone(nodeToSync);

      // Update css class name to the new one
      writable.__css.setClassName(className);
    }
  });

  // Finally, update the class name of the original node
  nodeToSync.__css.setClassName(className);
};

// Convert all styles to a single CSS string
export const $cssToString = (args?: {
  excludeCSSKeys?: Array<keyof types.CSSKeyValue>;
}) => {
  // Create a map of unique styles
  const styleMap: Record<string, CSS> = {};

  // Walk through all nodes and get unique styles, then store them in a map
  $walkNode($getRoot(), (node) => {
    if (hasCSS(node)) {
      const style = node.__css;
      // Use class name as a key to store unique styles
      styleMap[style.getClassName()] = style;
    }
  });

  // Convert styles to a CSS string
  return Object.values(styleMap)
    .map((css) =>
      css.toString({
        excludeCSSKeys: args?.excludeCSSKeys,
      })
    )
    .join("");
};

export const $cssValue = <T = any>(
  node: LexicalNode,
  key: keyof CSSProperties | `$${string}`,
  nestedKey?: `__${string}`
) => {
  if (!get$isWPLexicalNode()(node)) return undefined;

  const latestNode = $getNodeByKey(node.__key) as WPLexicalNode;
  const style = latestNode.__css.get();

  if (nestedKey) {
    return style[nestedKey]?.[key as keyof types.CSSKeyValue];
  }

  return style[key as keyof types.CSSKeyValue] as T;
};

export const cssToStringFromEditor = (
  editor: LexicalEditor,
  options?: { isEditorMode?: boolean }
) => {
  const isEditorMode = options?.isEditorMode ?? true;
  // Important:
  // Exclude transition property from the CSS string as it affects mouse interactions
  // In editor mode, we exclude 'transition' to prevent interference with UI interactions.
  // When is it not editor mode? This is when we are generating CSS for the live view. (see page.tsx)
  const excludeCSSKeys: Array<keyof types.CSSKeyValue> = isEditorMode
    ? ["transition"]
    : [];

  return editor.read(() =>
    $cssToString({
      excludeCSSKeys,
    })
  );
};
