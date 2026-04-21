import { WP_VOID_ELEMENT_ATTRIBUTE } from "./constants";

export const createVoidElement = () => {
  const element = document.createElement("template");
  element.setAttribute(WP_VOID_ELEMENT_ATTRIBUTE, "true");
  return element;
};
