import { ElementNode } from "lexical";

import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";

import { InputAttributes, InputType } from "./input";

export type SerializedInputNode = Spread<
  {
    __formName: string;
    __inputType: InputType;
    __inputAttributes: InputAttributes;
  },
  SerializedWPElementNode
>;

export class InputNode extends WPElementNode {
  __removable: boolean = false;
  //__draggable: boolean = false;

  __formName: string = "";
  __inputType: InputType = "text";
  __inputAttributes: InputAttributes = {};

  static getType(): string {
    return "form-input";
  }

  static clone(node: InputNode): InputNode {
    const newNode = new InputNode(node.__key);
    newNode.afterClone(node);
    newNode.__formName = node.__formName;
    newNode.__inputType = node.__inputType;
    newNode.__inputAttributes = { ...node.__inputAttributes };
    return newNode;
  }

  isEmpty(): boolean {
    return false;
  }

  setInputType(inputType: InputType): void {
    this.__inputType = inputType;
  }

  getInputType(): InputType {
    return this.__inputType;
  }

  getInputAttribute(key: keyof InputAttributes): string | undefined {
    return this.__inputAttributes[key];
  }

  getInputAttributes(): InputAttributes {
    return this.__inputAttributes;
  }

  setInputAttribute(key: keyof InputAttributes, value: string): void {
    this.__inputAttributes[key] = value;
  }

  setFormName(formName: string): void {
    this.__formName = formName;
  }

  getFormName(): string {
    return this.__formName;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("input");

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("input");

    this.__css.set({
      __layout: {
        display: "inline-flex",
        alignItems: "center",
        columnGap: "1px",
      },
      height: "30px",
    });

    if (this.__inputAttributes.placeholder) {
      element.setAttribute("placeholder", this.__inputAttributes.placeholder);
    }

    if (this.__inputAttributes.value) {
      element.setAttribute("value", this.__inputAttributes.value);
    } else {
      element.removeAttribute("value");
    }

    element.setAttribute("name", this.__formName);
    element.setAttribute("type", this.__inputType);
    return element;
  }

  updateDOM(
    prevNode: InputNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);

    if (this.__inputAttributes.placeholder) {
      element.setAttribute("placeholder", this.__inputAttributes.placeholder);
    } else {
      element.removeAttribute("placeholder");
    }

    if (this.__inputAttributes.value) {
      element.setAttribute("value", this.__inputAttributes.value);
    } else {
      element.removeAttribute("value");
    }

    element.setAttribute("name", this.__formName);
    element.setAttribute("type", this.__inputType);
    return false;
  }

  static importJSON(serializedNode: SerializedInputNode): InputNode {
    const node = $createInputNode();
    node.importJSON(serializedNode);
    // node.__formId = serializedNode.__formId;
    node.__formName = serializedNode.__formName;
    node.__inputType = serializedNode.__inputType;
    node.__inputAttributes = serializedNode.__inputAttributes || {};
    return node;
  }

  exportJSON(): SerializedInputNode {
    return {
      ...super.exportJSON(),
      // __formId: this.__formId,
      __formName: this.__formName,
      __inputType: this.__inputType,
      __inputAttributes: this.__inputAttributes,
      type: "form-input",
    };
  }
}

export const $createInputNode = (node?: InputNode) => {
  const input = new InputNode();
  //$afterFormRelatedNodeCreation(input, node);

  $afterWPElementNodeCreation(input, node);
  // input.__formId = node?.__formId || "";
  input.__formName = node?.__formName || "";

  input.__formName =
    node?.__formName || `input-${Math.floor(Math.random() * 1000000)}`;
  input.__inputType = node?.__inputType || "text";
  input.__inputAttributes = node?.__inputAttributes || {};
  return input;
};

export const $isInputNode = (node: unknown): node is InputNode & CSS =>
  node instanceof InputNode;
