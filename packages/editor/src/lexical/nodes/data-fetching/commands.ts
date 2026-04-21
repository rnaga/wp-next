import { createCommand } from "lexical";
import type { DataFetchingNode } from "./DataFetchingNode";
import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";
import * as types from "../../../types";

export const DATA_FETCHING_NODE_CREATED_COMMAND = createCommand<{
  node: DataFetchingNode;
}>();

export const DATA_FETCHING_NODE_DESTROYED_COMMAND = createCommand<{
  node: DataFetchingNode;
}>();

export const DATA_FETCHING_NODE_UPDATED_COMMAND = createCommand<{
  node: DataFetchingNode;
}>();

// command to trigger all of events above
export const DATA_FETCHING_NODE_CHANGED_COMMAND = createActionCommand<{
  node: DataFetchingNode;
}>();

export const DATA_FETCHING_NODE_FETCHED_COMMAND = createCommand<{
  node: DataFetchingNode;
}>();

/**
 * Fired after reloadDynamicValues completes. Carries the full context of the
 * reload: what data was fetched, what query triggered it, and which DOM nodes
 * were patched. Covers any fetched data reload, not just collections.
 */
export const RELOAD_DYNAMIC_VALUE_COMMAND =
  createActionCommand<types.DynamicValuesReloadedPayload>();
