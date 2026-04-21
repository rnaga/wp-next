import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import { createCommand, LexicalNode, Klass, EditorState } from "lexical";

import type * as types from "../../types";

export const CUSTOM_CODE_FETCHED_AND_UPDATED = createActionCommand<{
  customCodes: Record<types.CustomCodeInjectLocation, types.CustomCodeList>;
}>();
