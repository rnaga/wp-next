import { KlassConstructor, LexicalNode } from "lexical";
import { $createInputNode, $isInputNode, InputNode } from "./InputNode";
import { $createInputWrapperNode, InputWrapperNode } from "./InputWrapperNode";
import { $createLabelNode, $isLabelNode, LabelNode } from "./LabelNode";
import { FormNode } from "./FormNode";
import {
  $createTemplateTextNode,
  $isTemplateTextNode,
  TemplateTextNode,
} from "../template-text/TemplateTextNode";
import { $initializeFormScaffolding } from "./FormNode";
import { $syncParentCollections } from "../collection/CollectionNode";
import { $isLegendNode, LegendNode } from "./LegendNode";
import { FieldSetNode } from "./FieldSetNode";
import { logger } from "../../logger";
import { $createFormHandlerNode, $isFormHandlerNode } from "./FormHandlerNode";
import { $walkNode } from "../../walk-node";

export const INPUT_TYPES = [
  "text",
  "email",
  "password",
  "number",
  "checkbox",
  "radio",
  "submit",
  "reset",
  "button",
  "date",
  "datetime-local",
  "file",
  "hidden",
  "image",
  "month",
  "range",
  "search",
  "tel",
  "time",
  "url",
  "week",
] as const;

export type InputType = (typeof INPUT_TYPES)[number];

export const INPUT_TEXT_TYPE = [
  "text",
  "email",
  "password",
  "number",
  "date",
  "datetime-local",
  "file",
  "month",
  "range",
  "search",
  "tel",
  "time",
  "url",
  "week",
] as const;

export const INPUT_BUTTON_TYPE = ["submit", "reset", "button"] as const;

export const INPUT_CHOICE_TYPE = ["checkbox", "radio"] as const;

export const getInputTypeCategory = (
  type: InputType
): "text" | "button" | "choice" | "other" => {
  if (INPUT_TEXT_TYPE.includes(type as any)) {
    return "text";
  } else if (INPUT_BUTTON_TYPE.includes(type as any)) {
    return "button";
  } else if (INPUT_CHOICE_TYPE.includes(type as any)) {
    return "choice";
  } else {
    return "other";
  }
};

export const compareType = (
  typeA: (typeof INPUT_TYPES)[number],
  typeB: (typeof INPUT_TYPES)[number]
) => {
  return getInputTypeCategory(typeA) === getInputTypeCategory(typeB);
};

export const $isFormRelatedNode = (
  node: KlassConstructor<typeof LexicalNode> | LexicalNode | undefined
): boolean =>
  typeof node !== "undefined" &&
  (node.getType() === "form-input-wrapper" ||
    node.getType() === "form-input" ||
    node.getType() === "form-label" ||
    node.getType() === "fieldset");

export type InputAttributes = {
  placeholder?: string;
  value?: string;
};

const $getOrCreateLabelNode = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number]
): LabelNode => {
  const inputType = inputWrapperNode.__inputType;
  const isSameType = compareType(inputType, type);

  return (
    inputWrapperNode.getChildren().find($isLabelNode) || $createLabelNode()
  );
};

const $getOrCreateInputNode = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number]
): InputNode => {
  const inputType = inputWrapperNode.__inputType;
  const isSameType = compareType(inputType, type);

  return (
    inputWrapperNode.getChildren().find($isInputNode) || $createInputNode()
  );

  // return (
  //   (isSameType && inputWrapperNode.getChildren().find($isInputNode)) ||
  //   $createInputNode()
  // );
};

export const $buildTextInputElements = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number],
  attributes: InputAttributes = {}
) => {
  const labelNode = $getOrCreateLabelNode(inputWrapperNode, type);
  const inputNode = $getOrCreateInputNode(inputWrapperNode, type);

  // Remove all children before rebuilding
  const children = inputWrapperNode.getChildren();
  children.forEach((child) => child.remove());

  if (labelNode.__text === "") {
    const writableLabel = labelNode.getWritable();
    writableLabel.__text = "Label";
  }

  // For text inputs, there is label before input
  inputWrapperNode.append(labelNode.getLatest());

  // Then input node
  const writableInput = inputNode.getWritable();
  writableInput.setInputType(type);
  writableInput.__inputAttributes = {
    ...writableInput.__inputAttributes,
    ...attributes,
  };

  inputWrapperNode.append(inputNode.getLatest());

  // Adjust styles
  inputWrapperNode.__css.set({
    __layout: {
      display: "inline-flex",
      flexDirection: "column",
      gap: "2px",
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
  });
};

export const $buildButtonInputElements = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number],
  attributes: InputAttributes = {}
) => {
  const inputNode = $getOrCreateInputNode(inputWrapperNode, type);

  // Remove all children before rebuilding
  const children = inputWrapperNode.getChildren();
  children.forEach((child) => child.remove());

  // Button input only has input node
  const writableInput = inputNode.getWritable();
  writableInput.setInputType(type);
  writableInput.__inputAttributes = {
    ...writableInput.__inputAttributes,
    ...attributes,
  };

  writableInput.__css.set({
    border: "none",
  });

  inputWrapperNode.append(inputNode.getLatest());

  // Adjust styles
  inputWrapperNode.__css.set({
    __layout: {
      display: "inline-flex",
      flexDirection: "row",
      alignItems: "center",
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
  });
};

export const $buildChoiceInputElements = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number],
  attributes: InputAttributes = {}
) => {
  const labelNode = $getOrCreateLabelNode(inputWrapperNode, type);
  const inputNode = $getOrCreateInputNode(inputWrapperNode, type);

  // Remove all children before rebuilding
  const children = inputWrapperNode.getChildren();
  children.forEach((child) => child.remove());

  // For choice inputs, there is input first then label
  const writableInput = inputNode.getWritable();
  writableInput.setInputType(type);
  writableInput.__inputAttributes = {
    ...writableInput.__inputAttributes,
    ...attributes,
  };
  inputWrapperNode.append(inputNode.getLatest());

  const writableLabel = labelNode.getWritable();
  writableLabel.__text = type === "checkbox" ? "Checkbox" : "Radio";
  inputWrapperNode.append(writableLabel);

  // Adjust styles
  inputWrapperNode.__css.set({
    __layout: {
      display: "inline-flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "4px",
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
  });
};

export const $buildInputElements = (
  inputWrapperNode: InputWrapperNode,
  type: (typeof INPUT_TYPES)[number],
  attributes: InputAttributes = {}
) => {
  const category = getInputTypeCategory(type);

  switch (category) {
    case "text":
      logger.log(
        "Building Text Input Elements",
        inputWrapperNode,
        type,
        attributes
      );
      $buildTextInputElements(inputWrapperNode, type, attributes);
      break;
    case "button":
      $buildButtonInputElements(inputWrapperNode, type, attributes);
      break;
    case "choice":
      $buildChoiceInputElements(inputWrapperNode, type, attributes);
      break;
    default:
      // For other types, just create input node
      const inputNode = $createInputNode();
      inputNode.setInputType(type);
      inputNode.__inputAttributes = {
        ...inputNode.__inputAttributes,
        ...attributes,
      };
      inputWrapperNode.append(inputNode);

      // Adjust styles
      inputWrapperNode.__css.set({
        __layout: {
          display: "inline-flex",
          flexDirection: "column",
          gap: "2px",
        },
      });
  }

  const writable = inputWrapperNode.getWritable();
  writable.__inputType = type;
};

export const $buildFormElements = (formNode: FormNode) => {
  // Skip if messageClassName already exists
  if (formNode.__messageClassName) {
    return;
  }

  const writable = formNode.getWritable();

  // Append default input element
  const inputWrapperNode = $createInputWrapperNode();
  $buildInputElements(inputWrapperNode, "email", {
    placeholder: "Enter Email",
  });
  $updateFormLabel(inputWrapperNode, "Email Address");
  inputWrapperNode.__css.set({
    width: "80%",
  });
  writable.append(inputWrapperNode);

  // Append message element using TemplateTextNode
  const message = $createTemplateTextNode();
  message.__removable = false;
  message.setTemplate("Form submission message");
  message.loadText();
  writable.append(message);

  // Get className from message node and set to form node
  const messageClassName = message.__css.getClassName();
  if (messageClassName) {
    writable.setMessageClassName(messageClassName);
  }

  message.__css.set({
    marginTop: "20px",
    marginBottom: "20px",
    marginLeft: "20px",
    border: "1px solid #ccc",
    padding: "10px",
    minHeight: "50px",
    width: "80%",
    // message box is hidden by default
    display: "none",
  });

  // Append default submit button
  const submitButtonWrapperNode = $createInputWrapperNode();
  $buildInputElements(submitButtonWrapperNode, "submit", {
    value: "Submit",
  });
  writable.append(submitButtonWrapperNode);

  // Set styles for form and message
  writable.__css.set({
    height: "300px",
    width: "400px",
  });

  // Initialize form scaffolding now that messageClassName is set

  $initializeFormScaffolding(writable);
};

export const $buildFormHandlerNode = (formNode: FormNode) => {
  // Check if formHandlerNode already exists

  let exits = false;
  $walkNode(formNode, (node) => {
    if ($isFormHandlerNode(node)) {
      exits = true;
      return false; // Stop walking
    }
    return true;
  });

  if (exits) {
    return;
  }

  const formHandlerNode = $createFormHandlerNode();
  const writable = formHandlerNode.getWritable();
  writable.__config = {
    formId: formNode.getFormId(),
    messageClassName: formNode.getMessageClassName(),
    formHandlerType: formNode.getFormHandlerType(),
  };

  formNode.append(writable);
};

export const $getMessageNode = (
  formNode: FormNode
): TemplateTextNode | undefined => {
  const messageClassName = formNode.getMessageClassName();
  if (!messageClassName) {
    return undefined;
  }

  const messageNode = formNode
    .getChildren()
    .find(
      (child) =>
        $isTemplateTextNode(child) &&
        child.__css.getClassName() === messageClassName
    );

  return messageNode as TemplateTextNode;
};

export const $updateFormInputName = (
  node: InputWrapperNode,
  formName: string
) => {
  const inputNode = node.getChildren().find($isInputNode);
  if (!inputNode) {
    return;
  }
  const writableInput = inputNode.getWritable();
  writableInput.setFormName(formName);

  $syncParentCollections(writableInput);
};

export const $getFormInputName = (
  node: InputWrapperNode
): string | undefined => {
  const inputNode = node.getChildren().find($isInputNode);
  if (!inputNode) {
    return undefined;
  }
  return inputNode.getFormName();
};

export const $getFormLabel = (node: InputWrapperNode): string | undefined => {
  const labelNode = node.getChildren().find($isLabelNode);
  return labelNode?.getLabel();
};

export const $updateFormLabel = (node: InputWrapperNode, label: string) => {
  const labelNode = node.getChildren().find($isLabelNode);
  if (!labelNode) {
    return;
  }
  const writableLabel = labelNode.getWritable();
  writableLabel.setLabel(label);

  $syncParentCollections(writableLabel);
};

export const $updateInputAttribute = (
  node: InputWrapperNode,
  key: keyof InputAttributes,
  value: string
) => {
  const inputNode = node.getChildren().find($isInputNode);
  if (!inputNode) {
    return;
  }
  const writableInput = inputNode.getWritable();
  writableInput.setInputAttribute(key, value);

  $syncParentCollections(writableInput);
};

export const $updateLegendText = (
  fieldsetOrLegendNode: FieldSetNode | LegendNode,
  legendText: string
) => {
  const legendNode = $isLegendNode(fieldsetOrLegendNode)
    ? fieldsetOrLegendNode
    : (fieldsetOrLegendNode as FieldSetNode).getChildren().find($isLegendNode);

  if (!legendNode) {
    return;
  }

  const writable = legendNode.getWritable();
  writable.setLegendText(legendText || " ");

  $syncParentCollections(writable);
};

export const $getInputAttribute = (
  node: InputWrapperNode,
  key: keyof InputAttributes
): string | undefined => {
  const inputNode = node.getChildren().find($isInputNode);
  if (!inputNode) {
    return undefined;
  }
  return inputNode.getInputAttribute(key);
};

export const getInputAttributes = (
  node: InputWrapperNode
): InputAttributes | undefined => {
  const inputNode = node.getChildren().find($isInputNode);
  if (!inputNode) {
    return undefined;
  }
  return inputNode.getInputAttributes();
};
