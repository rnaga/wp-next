import {
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  Spread,
} from "lexical";

import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";

import { DynamicAttributes } from "../../dynamic-attributes";
import { CSS } from "../../styles-core/css";
import { $deferredSyncParentCollections } from "../collection/sync";

import type * as types from "../../../types";

export type SerializedWPDecoratorNode = Spread<
  {
    __css: Record<string, any>;
    __dynamicAttributes?: Record<string, any>;
  },
  SerializedDecoratorBlockNode
>;

export class WPDecoratorNode<T> extends DecoratorNode<T> {
  // Must return false. DecoratorNode.isInline() returns true by default, which causes
  // Lexical's reconciler to treat this node as inline. When an inline DecoratorNode is
  // the last child of an ElementNode (e.g. WrapperNode), the reconciler appends a managed
  // <br> after it for cursor positioning — visible in PreviewLayer but absent in HTML export
  // (FullScreenPreviewLayer, production). All WPDecoratorNodes are block-level elements,
  // so returning false prevents the spurious <br> from being injected.
  isInline(): boolean {
    return false;
  }

  __css: CSS;
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
    this.__updateDOMHasBeenCalledAndInitialized.initialized = false;
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

  getComputedStyle(editor: LexicalEditor) {
    const element = editor.getElementByKey(this.__key);
    return element ? window.getComputedStyle(element) : null;
  }

  setCSS(style: types.CSSKeyValue) {
    this.__css.set(style);
  }

  afterClone(prevNode: WPDecoratorNode<T>): void {
    this.__css = CSS.clone(prevNode);
    this.__dynamicAttributes = DynamicAttributes.clone(prevNode);
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  private __updateDOMHasBeenCalledAndInitialized = {
    initialized: false,
  };

  attachKey(element: HTMLElement, config: EditorConfig): void {
    // Attach key as data attribute only when editor mode
    if (
      this.isEditorMode(config) &&
      !element.getAttribute("__lexical__node_key__")
    ) {
      element.setAttribute("__lexical__node_key__", this.__key);
    }
  }

  __heightWhenEmpty: number = 0;

  // updateDOM(
  //   prevNode: WPDecoratorNode<T>,
  //   element: HTMLElement,
  //   config: EditorConfig
  // ) {
  //   this.__css.updateDOM(this, prevNode, element, config);

  //   if (
  //     !this.__updateDOMHasBeenCalledAndInitialized.initialized &&
  //     !this.isEmptyInEditorMode(config)
  //   ) {
  //     this.__updateDOMHasBeenCalledAndInitialized.initialized = true;
  //     this.deInitEmptyDOM(prevNode, element, config);
  //   }

  //   this.attachKey(element, config);

  //   return false;
  // }

  updateDOM(
    prevNode: WPDecoratorNode<T>,
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

    return false;
  }

  #initStyle(
    element: HTMLElement,
    style: CSS,
    config: EditorConfig,
    editor?: LexicalEditor
  ): void {}

  #deInitEmptyDOM(
    prevNode: WPDecoratorNode<T>,
    element: HTMLElement,
    config: EditorConfig
  ): void {
    // Clear editor styles from the CSS instance, but don't clear __editorCSS
    // because __editorCSS holds the default styles that should be reapplied
    this.__css.setEditorStyles({
      backgroundColor: "none",
    });
  }

  deInitEmptyDOM(
    prevNode: WPDecoratorNode<T>,
    element: HTMLElement,
    config: EditorConfig
  ): void {
    for (const key in element.style) {
      element.style.removeProperty(key);
    }
  }

  importJSON(serializedNode: SerializedWPDecoratorNode): void {
    this.__css = CSS.importJSON(this, serializedNode);
    this.__css.setEditorStyles(this.getEditorCSS());
    this.__dynamicAttributes = DynamicAttributes.importJSON(
      this,
      serializedNode
    );
    this.__dynamicAttributes.setCSSRef(this.__css);
  }

  exportJSON(): SerializedWPDecoratorNode {
    return {
      version: 1,
      type: "",
      format: "start",
      __css: this.__css.exportJSON(),
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

    //this.initStyle(this.__css, config, editor);
    this.initStyle(element, this.__css, config, editor);

    element.className = this.__css.getAllClassNames();

    this.attachKey(element, config);

    return element;
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

export const $afterWPDecoratorNodeCreation = (
  node: WPDecoratorNode<any>,
  prevNode?: WPDecoratorNode<any>
): void => {
  if (!prevNode) {
    return;
  }
  node.afterClone(prevNode);
};

export const $isWPDecoratorNode = (
  node: unknown
): node is WPDecoratorNode<any> => {
  return node instanceof WPDecoratorNode;
};
