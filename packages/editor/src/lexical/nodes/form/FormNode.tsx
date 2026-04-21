import { CSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";

import type { EditorConfig, LexicalEditor, Spread } from "lexical";
import { $syncParentCollections } from "../collection/CollectionNode";

export type FormConfig = {
  action: string;
  redirectUrl?: string;
};

export type SerializedFormNode = Spread<
  {
    __formId: string;
    __formHandlerType: string;
    __submitHandler?: {
      jsFunction: string;
      typescriptFunction: string;
    };
    __config: FormConfig;
    __messageClassName: string;
  },
  SerializedWPElementNode
>;

export class FormNode extends WPElementNode {
  __formId: string = `form-${Math.floor(Math.random() * 1000000)}`;
  __formHandlerType: string = "default";

  __submitHandler?: {
    jsFunction: string;
    typescriptFunction: string;
  };
  __config: FormConfig = {
    action: "",
    redirectUrl: undefined,
  };
  __messageClassName: string = "";

  static getType(): string {
    return "form";
  }

  static clone(node: FormNode): FormNode {
    const newNode = new FormNode(node.__key);
    newNode.afterClone(node);
    newNode.__formId = node.__formId;
    newNode.__submitHandler = node.__submitHandler;
    newNode.__config = node.__config;
    newNode.__messageClassName = node.__messageClassName;
    newNode.__formHandlerType = node.__formHandlerType;
    return newNode;
  }

  getFormId() {
    return this.__formId;
  }

  setFormId(formId: string) {
    this.__formId = formId;
  }

  getFormHandlerType(): string {
    return this.__formHandlerType;
  }

  setFormHandlerType(type: string): void {
    const writable = this.getWritable();
    writable.__formHandlerType = type;
  }

  getMessageClassName() {
    return this.__messageClassName;
  }

  setMessageClassName(className: string) {
    this.__messageClassName = className;
  }

  getSubmitHandler() {
    if (!this.__submitHandler) return undefined;

    return {
      jsFunction: Buffer.from(
        this.__submitHandler.jsFunction,
        "base64"
      ).toString("utf-8"),
      typescriptFunction: Buffer.from(
        this.__submitHandler.typescriptFunction,
        "base64"
      ).toString("utf-8"),
    };
  }

  setSubmitHandler(
    handler: { jsFunction: string; typescriptFunction: string } | undefined
  ) {
    if (!handler) {
      this.__submitHandler = undefined;
      return;
    }

    this.__submitHandler = {
      jsFunction: Buffer.from(handler.jsFunction, "utf-8").toString("base64"),
      typescriptFunction: Buffer.from(
        handler.typescriptFunction,
        "utf-8"
      ).toString("base64"),
    };

    $syncParentCollections(this);
  }

  getConfig(): FormConfig {
    return this.__config;
  }

  setConfig(config: FormConfig) {
    const writable = this.getWritable();
    writable.__config = config;
  }

  __heightWhenEmpty: number = 50;

  initEmptyDOM(): HTMLElement {
    const element = createFormElement(this);
    this.__css.setDefaultIfEmpty({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  deInitEmptyDOM(
    prevNode: WPElementNode,
    element: HTMLElement,
    config: EditorConfig
  ): void {}

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = createFormElement(this);

    return element;
  }

  updateDOM(
    prevNode: FormNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    super.updateDOM(prevNode, element, config);
    return false;
  }

  static importJSON(serializedNode: SerializedFormNode): FormNode {
    const node = $createFormNode();
    node.importJSON(serializedNode);
    node.__formId = serializedNode.__formId;
    node.__config = serializedNode.__config;
    node.__messageClassName = serializedNode.__messageClassName;
    node.__formHandlerType = serializedNode.__formHandlerType;

    // Always regenerate jsFunction to ensure it's up to date (not stale from a
    // previous code generation pass). The strategy differs by handler type.
    if (serializedNode.__submitHandler) {
      node.__submitHandler = recompileSubmitHandler(serializedNode);
    }

    return node;
  }

  exportJSON(): SerializedFormNode {
    return {
      ...super.exportJSON(),
      __formId: this.__formId,
      __formHandlerType: this.__formHandlerType,
      __submitHandler: this.__submitHandler,
      __config: this.__config,
      __messageClassName: this.__messageClassName,
      type: "form",
    };
  }
}

/**
 * Recompiles the submit handler's `jsFunction` from its stored TypeScript source.
 *
 * Called during `importJSON` to guarantee the compiled JS is always up-to-date —
 * stale base64-encoded JS from a previous save is never reused directly.
 *
 * Two strategies are used depending on `__formHandlerType`:
 *
 * - **Non-default handlers** (e.g. "google-contact"): the handler only needs to
 *   dispatch a WordPress event, so the full TS→JS compilation pipeline is skipped.
 *   `createWpEventOnlyCode` generates a minimal dispatcher stored as the new `jsFunction`.
 *
 * - **Default handler**: the raw TS body stored in `typescriptFunction` (base64) is
 *   decoded, wrapped in the full scaffolding via `createTypeScriptScaffolding` (which
 *   injects the FormConfig, message class, and type declarations), then transpiled to
 *   JS by `transpileTypeScriptToJavaScript`. If transpilation fails, the previously
 *   saved `jsFunction` is kept as a fallback so the form remains functional.
 *
 * All JS values are stored as base64-encoded strings to survive JSON serialization.
 */
const recompileSubmitHandler = (
  serializedNode: SerializedFormNode
): NonNullable<FormNode["__submitHandler"]> => {
  const {
    createTypeScriptScaffolding,
    transpileTypeScriptToJavaScript,
    createWpEventOnlyCode,
  } = require("./scaffolding");

  const { typescriptFunction, jsFunction: existingJsFunction } =
    serializedNode.__submitHandler!;

  if (serializedNode.__formHandlerType !== "default") {
    // Non-default handlers only need the wpEvent dispatcher — no user TS code.
    const jsCode = createWpEventOnlyCode(serializedNode.__formId);
    return {
      typescriptFunction,
      jsFunction: Buffer.from(jsCode, "utf-8").toString("base64"),
    };
  }

  const userCodeBody = Buffer.from(typescriptFunction, "base64").toString(
    "utf-8"
  );

  const fullTsCode = createTypeScriptScaffolding(
    serializedNode.__config,
    serializedNode.__messageClassName,
    userCodeBody
  );

  const { jsCode, error } = transpileTypeScriptToJavaScript(
    fullTsCode,
    serializedNode.__formId
  );

  return {
    typescriptFunction,
    jsFunction:
      !error && jsCode
        ? Buffer.from(jsCode, "utf-8").toString("base64")
        : existingJsFunction,
  };
};

const createFormElement = (node: FormNode): HTMLFormElement => {
  const form = document.createElement("form");
  form.setAttribute("id", node.__formId);
  form.setAttribute("action", "javascript:void(0);");

  return form;
};

export const $createFormNode = (node?: FormNode) => {
  const form = new FormNode();
  $afterWPElementNodeCreation(form, node);
  form.__config = node?.__config || form.__config;
  form.__messageClassName = node?.__messageClassName || form.__messageClassName;

  // Only copy submitHandler if cloning an existing node
  if (node?.__submitHandler) {
    form.__submitHandler = node.__submitHandler;
  }
  // Note: For new nodes, scaffolding will be initialized after $buildFormElements
  // sets the messageClassName (see $initializeFormScaffolding)

  return form;
};

export const $isFormNode = (node: unknown): node is FormNode & CSS =>
  node instanceof FormNode;

// Initialize form scaffolding code after messageClassName is set
export const $initializeFormScaffolding = (formNode: FormNode) => {
  // Only initialize if not already set and messageClassName is available
  if (formNode.__submitHandler || !formNode.__messageClassName) {
    return;
  }

  const {
    createTypeScriptScaffolding,
    transpileTypeScriptToJavaScript,
    extractEditableBody,
    createWpEventOnlyCode,
  } = require("./scaffolding");

  if (formNode.__formHandlerType !== "default") {
    // Non-default handlers only need the wpEvent dispatcher — no TS scaffolding.
    const jsCode = createWpEventOnlyCode(formNode.__formId);
    const writable = formNode.getWritable();
    writable.__submitHandler = {
      jsFunction: Buffer.from(jsCode, "utf-8").toString("base64"),
      typescriptFunction: Buffer.from("", "utf-8").toString("base64"),
    };
    return;
  }

  // Create full scaffolding with default user code
  const fullTsCode = createTypeScriptScaffolding(
    formNode.__config,
    formNode.__messageClassName
  );

  // Extract just the user's editable body
  const userCodeBody = extractEditableBody(fullTsCode);

  // Transpile the full code to JavaScript
  const { jsCode, error } = transpileTypeScriptToJavaScript(
    fullTsCode,
    formNode.__formId
  );

  if (!error && jsCode) {
    const writable = formNode.getWritable();
    writable.__submitHandler = {
      jsFunction: Buffer.from(jsCode, "utf-8").toString("base64"),
      // Store only the user's editable code body
      typescriptFunction: Buffer.from(userCodeBody, "utf-8").toString("base64"),
    };
  }
};
