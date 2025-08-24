import { ReactElement, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "./use-portal";
import React from "react";

export const Portal = (props: {
  children: React.ReactNode;
  target?: HTMLElement | null;
}) => {
  const [target] = usePortal({ target: props.target || document.body });

  return <>{target && createPortal(props.children, target)}</>;
};
