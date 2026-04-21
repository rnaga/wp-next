import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { InputType } from "./input";

export type SerializedInputWrapperNode = Spread<
  {
    __inputType: InputType;
    // __formId: string;
  },
  SerializedWPElementNode
>;

export class InputWrapperNode extends WPElementNode {
  __inputType: InputType = "text";
  //__formId: string = "";

  static getType(): string {
    return "form-input-wrapper";
  }

  // setFormId(formId: string): void {
  //   this.__formId = formId;
  // }

  // getFormId(): string {
  //   return this.__formId;
  // }

  getInputType(): InputType {
    return this.__inputType;
  }

  static clone(node: InputWrapperNode): InputWrapperNode {
    const newNode = new InputWrapperNode(node.__key);
    newNode.afterClone(node);
    newNode.__inputType = node.__inputType;
    //newNode.__formId = node.__formId;
    return newNode;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = document.createElement("div");

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");

    return element;
  }

  updateDOM(
    prevNode: InputWrapperNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(
    serializedNode: SerializedInputWrapperNode
  ): InputWrapperNode {
    const node = $createInputWrapperNode();
    node.importJSON(serializedNode);
    node.__inputType = serializedNode.__inputType;
    //node.__formId = serializedNode.__formId;
    return node;
  }

  exportJSON(): SerializedInputWrapperNode {
    return {
      ...super.exportJSON(),
      __inputType: this.__inputType,
      //__formId: this.__formId,
      type: "form-input-wrapper",
    };
  }
}

export const $createInputWrapperNode = (node?: InputWrapperNode) => {
  const inputWrapper = new InputWrapperNode();
  $afterWPElementNodeCreation(inputWrapper, node);
  return inputWrapper;
};

export const $isInputWrapperNode = (
  node: unknown
): node is InputWrapperNode & CSS => node instanceof InputWrapperNode;
