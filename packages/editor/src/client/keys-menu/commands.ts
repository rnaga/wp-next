import { createCommand, LexicalNode } from "lexical";

export const CONTEXT_MENU_COMMAND = createCommand<{
  node: LexicalNode;
  event: React.MouseEvent;
}>();

export const ROOT_CONTEXT_MENU_COMMAND = createCommand<{
  event: React.MouseEvent;
}>();
