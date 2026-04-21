import { createCommand, LexicalNode } from "lexical";
import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

export const WIDGET_SELECTED = createCommand<{
  node: LexicalNode;
  slug: string;
}>();

export const WIDGET_SELECTED_AND_PROCESSED = createActionCommand<{
  node: LexicalNode;
  slug: string;
}>();
