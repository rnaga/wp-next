import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

export const WP_DRAG_OUT_WITH_ERROR_COMMAND = createActionCommand<{
  error: string;
}>();

export const WP_DRAG_ON_SUCCESS_COMMAND = createActionCommand<undefined>();

export const WP_DRAG_END_COMMAND = createActionCommand<undefined>();

export const WP_DRAG_END_WITH_ERROR_COMMAND = createActionCommand<{
  error: string;
}>();
