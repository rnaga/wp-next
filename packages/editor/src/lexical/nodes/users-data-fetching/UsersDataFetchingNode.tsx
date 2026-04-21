import { z } from "zod";

import {
  DataFetchingNode,
  DataFetchingPagination,
  SerializedDataFetchingNode,
  dataFetchingPaginationValidator,
} from "../data-fetching/DataFetchingNode";
import { usersDataFetchingValidator } from "./users-data-fetching-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";

type Query = NonNullable<wpTypes.crud.CrudParameters<"user", "list">[0]>;
type Data = wpTypes.crud.CrudReturnType<"user", "list">["data"];

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [
  "search",
  "post",
  "slug",
  "roles",
  "has_published_posts",
  "exclude_anonymous",
  "include",
  "include_unregistered_users",
  "per_page",
  "page",
  "order",
  "orderby",
];

export class UsersDataFetchingNode extends DataFetchingNode<Query, Data> {
  __hasPagination: boolean = true;

  static getValidator() {
    return usersDataFetchingValidator;
  }

  static getType(): string {
    return "users-data";
  }

  static clone(node: UsersDataFetchingNode): UsersDataFetchingNode {
    const newNode = new UsersDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): UsersDataFetchingNode {
    const node = $createUsersDataFetchingNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<
    | [z.infer<typeof usersDataFetchingValidator>, DataFetchingPagination]
    | [z.infer<typeof usersDataFetchingValidator>]
  > {
    const { actions } = serverActions;

    const query = this.getQuery();

    const result = await actions.user.list(query);

    const { data: users, info } = result;

    const usersWithIndex = users.map((user, index) => ({
      ...user,
      index: index + 1,
    }));

    const parsed = usersDataFetchingValidator.parse(usersWithIndex);

    const parsedPagination = info?.pagination
      ? dataFetchingPaginationValidator.parse(info.pagination)
      : undefined;
    return parsedPagination ? [parsed, parsedPagination] : [parsed];
  }
}

export const $createUsersDataFetchingNode = () => {
  const node = new UsersDataFetchingNode();
  return node;
};

export const $isUsersDataFetchingNode = (
  node: unknown
): node is UsersDataFetchingNode => node instanceof UsersDataFetchingNode;
