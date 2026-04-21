import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import type * as types from "../../types";

export const WP_CSS_VARIABLES_UPDATED_COMMAND = createActionCommand<{
  contentItem: types.CSSVariablesContentItem;
  cssVariables: types.CSSVariables;
}>();

export const WP_CSS_VARIABLES_DELETED_COMMAND = createActionCommand<{
  cssVariables: types.CSSVariables;
}>();

// export const WP_CSS_VARIABLES_LIST_UPDATED_COMMAND = createActionCommand<{
//   cssVariablesList: types.CSSVariablesList;
// }>();

// export const WP_CSS_VARIABLES_USAGE_KEY_REMOVED_COMMAND = createActionCommand<{
//   usageKey: string;
// }>();
