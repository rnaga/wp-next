import { LexicalNode } from "lexical";
import { JSX } from "react";

export type ContextMenuEventHandler = (props: {
  node: LexicalNode;
  event: React.MouseEvent;
  anchorReference: "anchorPosition";
  anchorPosition?: { top: number; left: number };
  close: () => void;
}) => JSX.Element;

export type ContextMenuEventHandlerParameters =
  Parameters<ContextMenuEventHandler>[0];

export type RootContextMenuEventHandlerParameters = Pick<
  ContextMenuEventHandlerParameters,
  "event" | "anchorReference" | "anchorPosition" | "close"
>;
