import {
  createActionCommand,
  createFilterCommand,
} from "@rnaga/wp-node/common/hooks-command";

/**
 * Fired by SearchBox when the user submits a search or clicks the reset button.
 * Listeners (e.g. PaginationNode) use this to reset the page to 1 — updating
 * both the URL and the shared query cache — so sibling nodes stay in sync
 * without SearchBox needing to know about them.
 */
export const SEARCH_BOX_NODE_SEARCH_COMMAND = createFilterCommand<{
  // The collection this SearchBox targets; listeners filter on this value.
  targetCollection: string;

  // Shared state bag for coordinating multiple listeners of the same command.
  // The first handler that acts sets a flag here (e.g. states.pageReset = true)
  // so subsequent handlers for the same targetCollection can skip.
  states: Record<string, any>;
}>();
