import { createCommand, LexicalNode } from "lexical";
import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

export const WP_UPDATE_FOCUS_ON_SELECTED_NODE_COMMAND =
  createActionCommand<boolean>();
