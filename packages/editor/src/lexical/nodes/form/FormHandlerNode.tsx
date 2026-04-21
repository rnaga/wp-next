import { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import { ReactNode } from "react";

import {
  ReactDecoratorNode,
  SerializedReactDecoratorNode,
} from "../react-decorator/ReactDecoratorNode";
import { $afterWPDecoratorNodeCreation } from "../wp/WPDecoratorNode";
import { FormHandler } from "./client/FormHandler";

export type FormHandlerConfig = {
  formId?: string;
  formHandlerType?: string;
  messageClassName?: string;
};

export type SerializedFormHandlerNode = Spread<
  {
    __config: FormHandlerConfig;
  },
  SerializedReactDecoratorNode
>;

export class FormHandlerNode extends ReactDecoratorNode {
  __hidden: boolean = false;
  __removable: boolean = false;
  __editableMouseTool: boolean = false;
  __editableContextMenu: boolean = false;
  __draggable: boolean = false;

  ID: number;
  __config: FormHandlerConfig = {};
  constructor(ID?: number, key?: NodeKey) {
    super(ID, key);
    this.ID = ID ?? Math.floor(Math.random() * 100000);
  }

  static getType(): string {
    return "form-handler";
  }

  getConfig(): FormHandlerConfig {
    return this.__config;
  }

  isEmpty(): boolean {
    return this.__config.formId ? false : true;
  }

  setConfig(config: FormHandlerConfig): void {
    this.__config = config;
  }

  static clone(node: FormHandlerNode): FormHandlerNode {
    const newNode = new FormHandlerNode(node.ID, node.__key);
    newNode.__config = node.__config;
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedFormHandlerNode
  ): FormHandlerNode {
    const formhandle = $createFormHandlerNode();
    formhandle.importJSON(serializedNode);
    formhandle.ID = serializedNode.ID;
    formhandle.__config = serializedNode.__config;
    return formhandle;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    return super.createDOM(config, editor);
  }

  updateDOM(
    prevNode: FormHandlerNode,
    element: HTMLElement,
    config: EditorConfig
  ): false {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  decorate(): ReactNode {
    return <FormHandler config={this.__config} />;
  }

  exportJSON(): SerializedFormHandlerNode {
    return {
      ...super.exportJSON(),
      type: "form-handler",
      __config: this.__config,
      version: 1,
    };
  }
}

export const $createFormHandlerNode = (node?: FormHandlerNode) => {
  const formhandler = new FormHandlerNode();
  formhandler.__config = node ? node.__config : {};
  $afterWPDecoratorNodeCreation(formhandler, node);
  return formhandler;
};

export function $isFormHandlerNode(
  node: LexicalNode | null | undefined
): node is FormHandlerNode {
  return node instanceof FormHandlerNode;
}
