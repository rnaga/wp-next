import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import { InputWrapperNode } from "./InputWrapperNode";

export type FormInputPropertyUpdatedPayload = {
  node: InputWrapperNode;
};

export const FORM_INPUT_PROPERTY_UPDATED =
  createActionCommand<FormInputPropertyUpdatedPayload>();
