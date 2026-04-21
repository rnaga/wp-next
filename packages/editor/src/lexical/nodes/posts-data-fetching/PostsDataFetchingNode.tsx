import { z } from "zod";

import {
  DataFetchingNode,
  DataFetchingPagination,
  SerializedDataFetchingNode,
  dataFetchingPaginationValidator,
} from "../data-fetching/DataFetchingNode";
import { postsDataFetchingValidator } from "./posts-data-fetching-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";

type Query = wpTypes.crud.CrudParameters<"post", "list">[0] & {
  postType?: wpTypes.PostType;
};
type Data = wpTypes.crud.CrudReturnType<"post", "list">["data"];

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [
  "search",
  "categories",
  "tags",
  "author",
  "per_page",
  "page",
  "order",
  "orderby",
];

export class PostsDataFetchingNode extends DataFetchingNode<Query, Data> {
  __hasPagination: boolean = true;

  static getValidator() {
    return postsDataFetchingValidator;
  }

  static getType(): string {
    return "posts-data";
  }

  static clone(node: PostsDataFetchingNode): PostsDataFetchingNode {
    const newNode = new PostsDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): PostsDataFetchingNode {
    const node = $createPostsDataFetchingNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<
    | [z.infer<typeof postsDataFetchingValidator>, DataFetchingPagination]
    | [z.infer<typeof postsDataFetchingValidator>]
  > {
    const { actions } = serverActions;

    const { postType, ...query } = this.getQuery();

    const result = await actions.post.list(query, {
      postTypes: postType ? [postType] : ["post"],
    });

    // Attach index to each post for stable keys in React lists
    const postsWithIndex = result.data.map((post, index) => ({
      ...post,
      index: index + 1, // Start index at 1 for better readability
    }));

    const { data: posts, info } = result;
    const parsed = postsDataFetchingValidator.parse(postsWithIndex);

    const parsedPagination = info?.pagination
      ? dataFetchingPaginationValidator.parse(info.pagination)
      : undefined;
    return parsedPagination ? [parsed, parsedPagination] : [parsed];
  }
}

export const $createPostsDataFetchingNode = () => {
  const node = new PostsDataFetchingNode();
  return node;
};

export const $isPostsDataFetchingNode = (
  node: unknown
): node is PostsDataFetchingNode => node instanceof PostsDataFetchingNode;
