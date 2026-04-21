import { wpLexicalTemplatePipeFunctions } from "_wp/lexical";
import { extractTemplateExpressions } from "./parse-template-pipe";

import {
  $getEditor,
  $getRoot,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  Spread,
} from "lexical";

import { CSS } from "../../styles-core/css";
import { $deferredSyncParentCollections } from "../collection/sync";

import {
  $getFetchedData,
  $getFetchedPagination,
  $isDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import {
  $afterWPTextNodeCreation,
  SerializedWPTextNode,
  WPTextNode,
} from "../wp/WPTextNode";
import {
  $findParentCollectionElementNode,
  $isCollectionElementNode,
  $isInCollectionElementNode,
  CollectionElementNode,
} from "../collection/CollectionElementNode";
import { NODE_PROPERTY_UPDATED } from "../../../client/node-event";
import type { WPLexicalNode } from "../wp/types";
import { HTML_CONTAINER_ELEMENT_TAGS } from "./constants";

export type HTMLContainerElementTag =
  (typeof HTML_CONTAINER_ELEMENT_TAGS)[number];

export type SerializedTemplateTextNode = Spread<
  {
    __template: string;
    __settings: Record<string, any>;
    __elementType: string;
  },
  SerializedWPTextNode
>;

export class TemplateTextNode extends WPTextNode {
  __template: string = "";
  __settings: Record<string, any> = {};
  __currentText: string = "";
  __isTemplateText = true;
  __elementType: string = "div";

  constructor(__text?: string, key?: string) {
    super(__text ?? "", key);
  }

  static getType() {
    return "template-text";
  }

  setSettings(settings: Record<string, any>) {
    this.__settings = settings;
  }

  getSettings() {
    return this.__settings;
  }

  static clone(node: TemplateTextNode) {
    const newNode = new TemplateTextNode(node.__text, node.__key);
    inheritTemplateTextNode(newNode, node);
    return newNode;
  }

  getCurrentText() {
    return this.__currentText;
  }

  setTemplate(template: string) {
    // Set empty template if the template is not set
    this.__template = template ?? "";
  }

  // Don't use this method directly. Use $loadTemplate instead
  loadText(options?: { data?: Record<string, any> }) {
    const template = this.__template;

    // If the template is not set, return
    if (typeof template !== "string") {
      return;
    }

    let data = options?.data;

    // Data resolution hierarchy for template rendering:
    // 1. If data is explicitly provided via options, use it (already set above)
    // 2. If no data provided AND this node is nested within a CollectionElementNode,
    //    inherit the data context from that collection element
    //
    // This allows TemplateTextNodes inside collections to automatically access
    // the current iteration's data without requiring manual data passing.
    // For example, in a list of users, each TemplateTextNode will automatically
    // receive the data for its specific user item.
    // if (!data && $isInCollectionElementNode(this)) {
    //   // Traverse up to find the parent CollectionElementNode and get its data context
    //   data = $findParentCollectionElementNode(this)?.getDataForThisElement();
    // }

    // $consoleCacheData(data);
    const processedTextContext = $processTemplateText(template, {
      data,
      node: this,
    });

    // Parse the template and set the text
    //const writable = this.getWritable();

    // Set the current text
    this.__currentText = processedTextContext;

    // Set the text content in TextNode
    this.setTextContent && this.setTextContent(processedTextContext);
  }

  isEmpty(): boolean {
    return !this.__template || this.__template.length === 0;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__elementType);

    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement(this.__elementType);
    for (const key in element.style) {
      element.style.removeProperty(key);
    }
    element.innerHTML = `${this.__text}`;
    return element;
  }

  updateDOM(
    prevNode: TemplateTextNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    element.innerHTML = this.__text;

    if (this.__elementType !== prevNode.__elementType) {
      return true;
    }

    return false;
  }

  static importJSON(
    serializedNode: SerializedTemplateTextNode
  ): TemplateTextNode {
    const node = new TemplateTextNode(
      (serializedNode as any).__text,
      (serializedNode as any).__key
    );
    node.importJSON(serializedNode);
    inheritSerializedTemplateTextNode(node, serializedNode);
    return node;
  }

  exportJSON(): SerializedTemplateTextNode {
    return {
      ...super.exportJSON(),
      type: this.getType(),
      __template: this.__template,
      __settings: this.__settings,
      __elementType: this.__elementType,
      text: "",
      version: 1,
    };
  }
}

export const inheritSerializedTemplateTextNode = (
  node: TemplateTextNode,
  serializedNode: SerializedTemplateTextNode
) => {
  node.importJSON(serializedNode);
  node.__template = serializedNode.__template;
  node.__settings = serializedNode.__settings;
  node.__elementType = serializedNode.__elementType;
};

export const inheritTemplateTextNode = (
  node: TemplateTextNode,
  prevNode?: TemplateTextNode
) => {
  if (prevNode) {
    node.__template = prevNode.__template;
    node.__currentText = prevNode.__currentText;
    node.afterClone(prevNode);
    node.__settings = prevNode.__settings;
    node.__elementType = prevNode.__elementType;
  }

  return node;
};

export const $processTemplateText = (
  template: string,
  options?: {
    data?: Record<string, any>;
    node: WPLexicalNode;
  }
) => {
  const expressions = extractTemplateExpressions(template);

  // If there are no variables, return the template as is
  if (expressions.length === 0) {
    return template;
  }

  // Before processing the text, set the text to the template
  let processedTextContext = template;

  let data = options?.data;

  // Data resolution hierarchy for template rendering:
  // 1. If data is explicitly provided via options, use it (already set above)
  // 2. If no data provided AND this node is nested within a CollectionElementNode,
  //    inherit the data context from that collection element
  //
  // This allows TemplateTextNodes inside collections to automatically access
  // the current iteration's data without requiring manual data passing.
  // For example, in a list of users, each TemplateTextNode will automatically
  // receive the data for its specific user item.
  if (!data && options?.node && $isInCollectionElementNode(options.node)) {
    // Traverse up to find the parent CollectionElementNode and get its data context
    data = $findParentCollectionElementNode(
      options.node
    )?.getDataForThisElement();
  }

  // Get the data nodes
  const dataNodes = $getRoot().getChildren().filter($isDataFetchingNode);

  for (const { fullMatch, varPath, pipeName, pipeParams } of expressions) {
    const [name, ...keys] = varPath.split(".").map((s) => s.trim());

    // Handle %pagination.{nodeName}.{field} expressions
    if (name === "%pagination") {
      const [nodeName, ...paginationFields] = keys;
      const paginationNode = dataNodes.find((n) => n.getName() === nodeName);
      if (paginationNode?.__hasPagination) {
        const pagination = $getFetchedPagination(paginationNode) as
          | Record<string, any>
          | undefined;
        let value: any = pagination;
        for (const field of paginationFields) {
          value = value?.[field];
        }
        if (value !== undefined) {
          processedTextContext = processedTextContext.replace(
            fullMatch,
            `${value}`
          );
        }
      }
      continue;
    }

    // 1. Check if the data is passed in the options
    // 2. If not, check if the data is available in the data nodes
    const nestedData =
      data?.[name] ??
      dataNodes.find((node) => node.getName() === name)?.getData() ??
      $getFetchedData(name);

    // If the data node is not found, skip the variable
    if (!nestedData) {
      continue;
    }

    // Get the value of the key from the data
    let value = nestedData;
    for (let i = 0; i < keys.length; i++) {
      value = value?.[keys[i]];
    }

    let stringValue = `${value}`;

    // Apply pipe function if specified and found
    if (pipeName) {
      const pipeFunc = wpLexicalTemplatePipeFunctions[pipeName];
      if (pipeFunc) {
        stringValue = pipeFunc.fn(stringValue, pipeParams);
      }
    }

    processedTextContext = processedTextContext.replace(fullMatch, stringValue);
  }

  return processedTextContext;
};

export const $createTemplateTextNode = (node?: TemplateTextNode) => {
  const templateText = new TemplateTextNode();
  $afterWPTextNodeCreation(templateText, node);
  inheritTemplateTextNode(templateText, node);
  return templateText;
};

export const $isTemplateTextNode = (node: any): node is TemplateTextNode => {
  return node instanceof TemplateTextNode || node?.__isTemplateText;
};

export const $isSerializedTemplateTextNode = (
  serialized: any
): serialized is SerializedTemplateTextNode => {
  return serialized?.__isTemplateText == true;
};

export const $getTemplateTextSettings = (
  node: TemplateTextNode,
  options: { data?: Record<string, any> }
) => {
  const settings = node.__settings;
  let processedSettings: Record<string, any> = {};
  for (const key in settings) {
    processedSettings[key] = $processTemplateText(settings[key], {
      ...options,
      node,
    });
  }

  return processedSettings;
};

export const $loadTemplateText = (node: TemplateTextNode) => {
  const writable = node.getWritable();
  writable.loadText();

  // Sync other TemplateTextNodes in the same collection if applicable
  $deferredSyncParentCollections(writable);
};
