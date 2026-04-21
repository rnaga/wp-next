import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

export const WP_PROCESS_REACT_DECORATORS_COMMAND =
  createActionCommand<undefined>();

export const WP_REACT_DECORATORS_UPDATED_COMMAND =
  createActionCommand<React.ReactNode[]>();
