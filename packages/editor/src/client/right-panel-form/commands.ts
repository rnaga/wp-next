import { createCommand, NodeKey } from "lexical";
import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { CSSProperties } from "react";

import type * as types from "../../types";

export const EDIT_LAYER_SHOULD_RELOAD_COMMAND =
  createActionCommand<undefined>();

export const RIGHT_PANEL_FORM_UPDATE_COMMAND = createActionCommand<{
  nodeKey: NodeKey;
  formData: CSSProperties;
}>();

export const CSS_EDITOR_ELEMENT_STATE_CHANGED_COMMAND = createActionCommand<{
  elementState: types.CSSState;
}>();
