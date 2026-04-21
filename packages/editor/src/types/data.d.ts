import { getEditorServerActionsUtils } from "../server/actions/get-editor-server-actions-utils";
export type DataServerActions = ReturnType<typeof getEditorServerActionsUtils>;

/**
 * Maps each data-fetching node key to its fetched data payload.
 * The outer key is the node's identifier (e.g. `"post-data"` for `PostDataFetchingNode`),
 * and the inner record holds the fetched data as key-value pairs.
 *
 * @example
 * {
 *   "post-data": {
 *     ID: 1,
 *     post_title: "Post Title",
 *     ...
 *   },
 * }
 */
export type FetchedDataMapping = Record<string, Record<string, any>>;
