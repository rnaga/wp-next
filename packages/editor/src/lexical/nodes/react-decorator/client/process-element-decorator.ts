"use client";
import { createPortal } from "react-dom";
import { ReactElementDecoratorNode } from "../ReactElementDecoratorNode";
import { REACT_DECORATOR_DATA_ATTRIBUTE } from "../ReactDecoratorNode";
import { logger } from "../../../logger";

export const processElementDecorator = (args: {
  node: ReactElementDecoratorNode;
}) => {
  const { node } = args;
  const target = document.querySelector(
    `[${REACT_DECORATOR_DATA_ATTRIBUTE}="${node.ID}"`
  );

  logger.log( "ReactElementDecorator", node.ID, target);
  if (target) {
    createPortal(args.node.decorate(), target);
  }
};
