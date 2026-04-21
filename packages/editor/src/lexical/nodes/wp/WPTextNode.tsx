import {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  SerializedTextNode,
  Spread,
  TextNode,
} from "lexical";
import type { DOMExportOutput } from "lexical";
import { HTMLAttributes } from "react";

import { DynamicAttributes } from "../../dynamic-attributes";
import { CSS } from "../../styles-core/css";
import { $deferredSyncParentCollections } from "../collection/sync";
import { RESERVED_ATTRIBUTE_KEYS } from "./constants";

import type * as types from "../../../types";

export type SerializedWPTextNode = Spread<
  {
    __css: Record<string, any>;
    __attributes: HTMLAttributes<any>;
    __dynamicAttributes?: Record<string, any>;
  },
  SerializedTextNode
>;

export class WPTextNode extends TextNode {
  __css: CSS;
  __attributes: HTMLAttributes<any> = {};
  // Tracks all attribute keys ever applied to the DOM element (editor-only, not exported/imported)
  __appliedAttributeKeys: Set<string> = new Set();
  __dynamicAttributes: DynamicAttributes;

  // Used to determine if the node is removable or not via the UI
  __removable: boolean = true;

  __editableMouseTool: boolean = true;
  __editableContextMenu: boolean = true;

  // Used to determine if the node is draggable or not via the UI
  __draggable: boolean = true;

  __editorEmptyCSS: types.CSSEditor = {
    backgroundColor: "rgba(173, 216, 230, 0.5)",
  };

  __editorNonEmptyCSS: types.CSSEditor = {
    backgroundColor: "none",
  };

  constructor(text: string, key?: string) {
    super(text, key);
    this.__css = new CSS(this.__key);
    this.__dynamicAttributes = new DynamicAttributes(this.__key);
    this.__dynamicAttributes.setCSSRef(this.__css);

    //this.__css.setEditorStyles(this.__editorEmptyCSS);
  }

  getEditorCSS(): Partial<Record<types.CSSKey, any>> {
    const mergedStyles = {
      ...this.__css.getEditorStyles(),
      ...(this.isEmpty() ? this.__editorEmptyCSS : this.__editorNonEmptyCSS),
    };

    return mergedStyles;
  }

  getCSSEditorModeConfig(key: string) {
    return this.__css.getEditorModeConfig(key);
  }

  getDynamicAttributesEditorModeConfig(key: string) {
    return this.__dynamicAttributes.getEditorModeConfig(key);
  }

  getCSSString() {
    return this.__css.toString();
  }

  getCss() {
    return this.__css.get();
  }

  getAttributes() {
    return this.__attributes;
  }

  getComputedStyle(editor: LexicalEditor) {
    const element = editor.getElementByKey(this.__key);
    return element ? window.getComputedStyle(element) : null;
  }

  setCSS(style: types.CSSKeyValue) {
    this.__css.set(style);
  }

  setAttributes(attributes: HTMLAttributes<any>) {
    // Filter out reserved attribute keys
    const filteredAttributes: Record<string, any> = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (!RESERVED_ATTRIBUTE_KEYS.includes(key)) {
        filteredAttributes[key] = value;
      }
    }

    this.__attributes = {
      ...filteredAttributes,
    };
  }

  afterClone(prevNode: WPTextNode): void {
    this.__css = CSS.clone(prevNode);
    this.__attributes = { ...prevNode.__attributes };
    this.__appliedAttributeKeys = new Set(prevNode.__appliedAttributeKeys);
    this.__dynamicAttributes = DynamicAttributes.clone(prevNode);
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  getEmptyText(): string {
    return `${this.getType()} - ${this.getKey()}`;
  }

  private __updateDOMHasBeenCalledAndInitialized = {
    initialized: false,
  };

  __heightWhenEmpty: number = 0;

  updateDOM(prevNode: WPTextNode, element: HTMLElement, config: EditorConfig) {
    super.updateDOM(this, element, config);
    this.__css.updateDOM(this, prevNode, element, config);

    if (this.isEmptyInEditorMode(config)) {
      this.#initStyle(element, this.__css, config);
      this.initStyle(element, this.__css, config);
      this.__updateDOMHasBeenCalledAndInitialized.initialized = false;
    } else if (!this.__updateDOMHasBeenCalledAndInitialized.initialized) {
      this.__updateDOMHasBeenCalledAndInitialized.initialized = true;
      this.#deInitEmptyDOM(prevNode, element, config);
      this.deInitEmptyDOM(prevNode, element, config);
    }

    this.attachKey(element, config);
    this.attachAttributesInDOM(element, config);

    return false;
  }

  attachKey(element: HTMLElement, config: EditorConfig): void {
    // Attach key as data attribute only when editor mode
    if (
      this.isEditorMode(config) &&
      !element.getAttribute("__lexical__node_key__")
    ) {
      element.setAttribute("__lexical__node_key__", this.__key);
    }
  }

  #initStyle(
    element: HTMLElement,
    style: CSS,
    config: EditorConfig,
    editor?: LexicalEditor
  ): void {
    const css = this.__css.get();

    // Set height inlined style if there are no children
    if (this.isEmpty() && this.__heightWhenEmpty > 0) {
      // element.style.setProperty(
      //   "height",
      //   css.height?.toString() ?? `${this.__heightWhenEmpty}px`
      // );

      this.__css.setEditorStyles(this.getEditorCSS());
    } else {
      element.style.removeProperty("height");
    }
  }

  #deInitEmptyDOM(
    prevNode: WPTextNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {
    element.style.removeProperty("height");

    // Clear editor styles from the CSS instance, but don't clear __editorCSS
    // because __editorCSS holds the default styles that should be reapplied
    this.__css.setEditorStyles({
      backgroundColor: "none",
    });
  }

  deInitEmptyDOM(
    prevNode: WPTextNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {
    for (const key in element.style) {
      element.style.removeProperty(key);
    }
  }

  importJSON(serializedNode: SerializedWPTextNode): void {
    this.__css = CSS.importJSON(this, serializedNode);
    this.__css.setEditorStyles(this.getEditorCSS());
    this.__attributes = serializedNode.__attributes || {};
    this.__dynamicAttributes = DynamicAttributes.importJSON(
      this,
      serializedNode
    );
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  exportJSON(): SerializedWPTextNode {
    return {
      ...super.exportJSON(),
      __css: this.__css.exportJSON(),
      __attributes: this.__attributes,
      __dynamicAttributes: this.__dynamicAttributes.exportJSON(),
    };
  }

  isEmptyInEditorMode(config: EditorConfig): boolean {
    return this.isEmpty() && this.isEditorMode(config);
  }

  isEmpty(): boolean {
    throw new Error("Method not implemented.");
  }

  isEditorMode(config: EditorConfig): boolean {
    return config.namespace === "editing";
  }

  initStyle(
    element: HTMLElement,
    style: CSS,
    config: EditorConfig,
    editor?: LexicalEditor
  ): void {
    // const css = style.get();
    // element.style.setProperty("height", css.height?.toString() ?? `50px`);
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    throw new Error("Method not implemented.");
  }

  // method to create DOM when the node is not empty.
  // The method name isn't createDOM but similar to it.
  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    throw new Error("Method not implemented.");
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = this.isEmptyInEditorMode(config)
      ? this.initEmptyDOM(config, editor)
      : this.initDOM(config, editor);

    this.#initStyle(element, this.__css, config);
    this.initStyle(element, this.__css, config, editor);
    element.className = this.__css.getAllClassNames();

    this.attachAttributesInDOM(element, config);

    this.attachKey(element, config);

    return element;
  }

  /**
   * Extracts an explicitly configured `white-space` from this TextNode's style string.
   *
   * Why this exists:
   * - `TextNode.exportDOM()` in Lexical injects `white-space: pre-wrap` by default.
   * - We need to remove only that default when no explicit white-space was configured by downstream code.
   *
   * How it works:
   * - We parse `this.getStyle()` as raw CSS declarations.
   * - We keep the last `white-space` declaration (CSS cascade order) and extract optional `!important`.
   *
   * Notes:
   * - This intentionally avoids browser globals (`document`, `HTMLElement`) so it works in SSR/headless paths.
   *
   * Result:
   * - `null` means no explicit white-space exists on this node style.
   * - A returned value means white-space is intentional and must be preserved in export.
   */
  #getExplicitWhiteSpaceFromTextStyle(): {
    value: string;
    priority: string;
  } | null {
    const textStyle = this.getStyle();
    if (!textStyle) {
      return null;
    }

    let parsed: { value: string; priority: string } | null = null;

    for (const declaration of textStyle.split(";")) {
      const trimmedDeclaration = declaration.trim();
      if (!trimmedDeclaration) {
        continue;
      }

      const separatorIndex = trimmedDeclaration.indexOf(":");
      if (separatorIndex === -1) {
        continue;
      }

      const property = trimmedDeclaration
        .slice(0, separatorIndex)
        .trim()
        .toLowerCase();
      if (property !== "white-space") {
        continue;
      }

      let value = trimmedDeclaration.slice(separatorIndex + 1).trim();
      if (!value) {
        continue;
      }

      let priority = "";
      if (/\s*!important\s*$/i.test(value)) {
        value = value.replace(/\s*!important\s*$/i, "").trim();
        priority = "important";
      }

      if (!value) {
        continue;
      }

      parsed = { value, priority };
    }

    return parsed;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    const element = output.element;

    if (
      !element ||
      typeof element !== "object" ||
      !("style" in element) ||
      !element.style ||
      typeof element.style.getPropertyValue !== "function" ||
      typeof element.style.setProperty !== "function" ||
      typeof element.style.removeProperty !== "function"
    ) {
      return output;
    }

    const styledElement = element as {
      style: CSSStyleDeclaration;
      getAttribute?: (qualifiedName: string) => string | null;
      removeAttribute?: (qualifiedName: string) => void;
    };

    const explicitWhiteSpace = this.#getExplicitWhiteSpaceFromTextStyle();

    // Preserve explicit white-space from node text style.
    if (explicitWhiteSpace) {
      styledElement.style.setProperty(
        "white-space",
        explicitWhiteSpace.value,
        explicitWhiteSpace.priority
      );
      return output;
    }

    // Remove Lexical TextNode default export white-space only.
    if (styledElement.style.getPropertyValue("white-space") === "pre-wrap") {
      styledElement.style.removeProperty("white-space");
      if (
        typeof styledElement.getAttribute === "function" &&
        typeof styledElement.removeAttribute === "function" &&
        !styledElement.getAttribute("style")?.trim()
      ) {
        styledElement.removeAttribute("style");
      }
    }

    return output;
  }

  attachAttributesInDOM(element: HTMLElement, config: EditorConfig): void {
    // Seed tracking set with current attribute keys
    Object.keys(this.__attributes).forEach((key) => {
      this.__appliedAttributeKeys.add(key);
    });

    // Remove DOM attributes that were previously applied but are no longer present
    this.__appliedAttributeKeys.forEach((key) => {
      if (!(key in this.__attributes)) {
        element.removeAttribute(key);
      }
    });

    // Set current attributes
    Object.entries(this.__attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, value.toString());
      }
    });

    // Apply dynamic attributes
    // Always call applyToDOM - it clears previously applied attributes first,
    // then applies only matching rules (or nothing if no rules exist)
    if (this.__dynamicAttributes) {
      this.__dynamicAttributes.applyToDOM(element, {
        node: this,
        config,
      });
    }
  }

  insertAfter(
    nodeToInsert: LexicalNode,
    restoreSelection?: boolean
  ): LexicalNode {
    super.insertAfter(nodeToInsert, restoreSelection);
    //$checkNodeAndSyncCollectionElementNodesInCollection(this);
    $deferredSyncParentCollections(this);

    return nodeToInsert;
  }

  insertBefore(
    nodeToInsert: LexicalNode,
    restoreSelection?: boolean
  ): LexicalNode {
    super.insertBefore(nodeToInsert, restoreSelection);
    //$checkNodeAndSyncCollectionElementNodesInCollection(this);
    $deferredSyncParentCollections(this);

    return nodeToInsert;
  }

  // Important: Dont call this method directly (e.g. node.remove()), use $removeNode instead.
  // Otherwise, it will not sync collection element nodes
  remove(preserveEmptyParent?: boolean): void {
    super.remove(preserveEmptyParent);
  }
}

export const $afterWPTextNodeCreation = (
  node: WPTextNode,
  prevNode?: WPTextNode
): void => {
  if (!prevNode) {
    return;
  }
  node.afterClone(prevNode);
};

export const $isWPTextNode = (node: unknown): node is WPTextNode => {
  return node instanceof WPTextNode;
};
