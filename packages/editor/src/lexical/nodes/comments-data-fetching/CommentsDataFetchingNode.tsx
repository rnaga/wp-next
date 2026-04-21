import { z } from "zod";

import {
  DataFetchingNode,
  DataFetchingPagination,
  SerializedDataFetchingNode,
  dataFetchingPaginationValidator,
} from "../data-fetching/DataFetchingNode";
import { commentsDataFetchingValidator } from "./comments-data-fetching-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";

type Query = NonNullable<wpTypes.crud.CrudParameters<"comment", "list">[0]>;
type Data = wpTypes.crud.CrudReturnType<"comment", "list">["data"];

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [
  "search",
  "post",
  "post_slug",
  "author",
  "status",
  "parent",
  "per_page",
  "page",
  "order",
  "orderby",
];

export class CommentsDataFetchingNode extends DataFetchingNode<Query, Data> {
  __hasPagination: boolean = true;

  static getValidator() {
    return commentsDataFetchingValidator;
  }

  static getType(): string {
    return "comments-data";
  }

  static clone(node: CommentsDataFetchingNode): CommentsDataFetchingNode {
    const newNode = new CommentsDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): CommentsDataFetchingNode {
    const node = $createCommentsDataFetchingNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<
    | [z.infer<typeof commentsDataFetchingValidator>, DataFetchingPagination]
    | [z.infer<typeof commentsDataFetchingValidator>]
  > {
    const { actions } = serverActions;

    const defaultQuery: Query = {
      status: "approve",
    };

    const query = this.getQuery();

    const result = await actions.comment.list<"view">(
      { ...query, ...defaultQuery },
      { context: "view" }
    );
    const { data: comments, info } = result;

    const commentsWithIndex = comments.map((comment, index) => ({
      ...comment,
      index: index + 1,
    }));

    const parsed = commentsDataFetchingValidator.parse(commentsWithIndex);

    const parsedPagination = info?.pagination
      ? dataFetchingPaginationValidator.parse(info.pagination)
      : undefined;
    return parsedPagination ? [parsed, parsedPagination] : [parsed];
  }
}

export const $createCommentsDataFetchingNode = () => {
  const node = new CommentsDataFetchingNode();
  return node;
};

export const $isCommentsDataFetchingNode = (
  node: unknown
): node is CommentsDataFetchingNode => node instanceof CommentsDataFetchingNode;
