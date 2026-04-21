import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const CUSTOM_FONT_FAMILY_CREATED_COMMAND = createActionCommand<{
  fontFamily: wpCoreTypes.actions.Posts[number];
}>();

export const CUSTOM_FONT_FAMILY_DELETED_COMMAND = createActionCommand<{
  fontFamily: wpCoreTypes.actions.Posts[number];
}>();
