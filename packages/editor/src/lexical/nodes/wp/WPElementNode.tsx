import {
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  SerializedElementNode,
  Spread,
} from "lexical";
import { HTMLAttributes } from "react";

import { DynamicAttributes } from "../../dynamic-attributes";
import { CSS } from "../../styles-core/css";
import {
  $deferredIsCollectionNode,
  $deferredSyncParentCollections,
} from "../collection/sync";
import { RESERVED_ATTRIBUTE_KEYS } from "./constants";

import type * as types from "../../../types";

export type SerializedWPElementNode = Spread<
  {
    __css: Record<string, any>;
    __attributes: HTMLAttributes<any>;
    __dynamicAttributes?: Record<string, any>;
  },
  SerializedElementNode
>;

export class WPElementNode extends ElementNode {
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

  constructor(key?: string) {
    super(key);
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

  afterClone(prevNode: WPElementNode): void {
    this.__css = CSS.clone(prevNode);
    this.__attributes = { ...prevNode.__attributes };
    this.__appliedAttributeKeys = new Set(prevNode.__appliedAttributeKeys);
    this.__dynamicAttributes = DynamicAttributes.clone(prevNode);
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  private __updateDOMHasBeenCalledAndInitialized = {
    initialized: false,
  };

  __heightWhenEmpty: number = 0;

  updateDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ) {
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

  #initStyle(
    element: HTMLElement,
    style: CSS,
    config: EditorConfig,
    editor?: LexicalEditor
  ): void {
    const css = this.__css.get();

    // Set height inlined style if there are no children
    if (this.getChildren().length === 0 && this.__heightWhenEmpty > 0) {
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
    prevNode: WPElementNode,
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
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  importJSON(serializedNode: SerializedWPElementNode): void {
    this.__css = CSS.importJSON(this, serializedNode);
    this.__css.setEditorStyles(this.getEditorCSS());
    this.__attributes = serializedNode.__attributes || {};
    this.__dynamicAttributes = DynamicAttributes.importJSON(
      this,
      serializedNode
    );
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  exportJSON(): SerializedWPElementNode {
    return {
      ...super.exportJSON(),
      __css: this.__css.exportJSON(),
      __attributes: this.__attributes,
      __dynamicAttributes: this.__dynamicAttributes.exportJSON(),
    };
  }

  getEmptyText(): string {
    return `${this.getType()} - ${this.getKey()}`;
  }

  isEmptyInEditorMode(config: EditorConfig): boolean {
    return this.isEmpty() && this.isEditorMode(config);
  }

  isEmpty(): boolean {
    return this.getChildren().length === 0;
  }

  isEditorMode(config: EditorConfig): boolean {
    return config.namespace === "editing";
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

  initStyle(
    element: HTMLElement,
    style: CSS,
    config: EditorConfig,
    editor?: LexicalEditor
  ): void {
    // Set light blue background color with brightening effect
    //element.style.setProperty("background-color", "rgba(173, 216, 230, 0.5)");
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

    this.__css.createDOM(this, element, config);

    this.attachKey(element, config);
    this.attachAttributesInDOM(element, config);

    return element;
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
    const parentNode = this.getParent();
    super.remove(preserveEmptyParent);
  }

  append(...nodesToAppend: LexicalNode[]): this {
    const parentNode = this.getParent();
    super.append(...nodesToAppend);

    if (!$deferredIsCollectionNode(parentNode)) {
      //$checkNodeAndSyncCollectionElementNodesInCollection(this);
      $deferredSyncParentCollections(this);
    }

    return this;
  }

  attach(
    nodesToAppend: LexicalNode[] | LexicalNode,
    options?: { syncCollection?: boolean }
  ) {
    super.append(
      ...(Array.isArray(nodesToAppend) ? nodesToAppend : [nodesToAppend])
    );
    if (options?.syncCollection) {
      // $checkNodeAndSyncCollectionElementNodesInCollection(this);
      $deferredSyncParentCollections(this);
    }
  }
}

export const $afterWPElementNodeCreation = (
  node: WPElementNode,
  prevNode?: WPElementNode
): void => {
  if (!prevNode) {
    return;
  }
  node.afterClone(prevNode);
};

export const $isWPElementNode = (node: unknown): node is WPElementNode => {
  return node instanceof WPElementNode;
};
