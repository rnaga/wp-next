import { z } from "zod";

import {
  DataFetchingNode,
  DataFetchingPagination,
  SerializedDataFetchingNode,
  dataFetchingPaginationValidator,
} from "../data-fetching/DataFetchingNode";
import { termsDataFetchingValidator } from "./terms-data-fetching-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";

type Taxonomy = NonNullable<wpTypes.crud.CrudParameters<"term", "list">[0]>;
type Query = NonNullable<wpTypes.crud.CrudParameters<"term", "list">[1]>;
type Data = wpTypes.crud.CrudReturnType<"term", "list">["data"];

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [
  "page",
  "per_page",
  "search",
  "exclude",
  "include",
  "order",
  "orderby",
  "post",
  "slug",
];

export class TermsDataFetchingNode extends DataFetchingNode<
  Query & {
    taxonomy: Taxonomy;
  },
  Data
> {
  __hasPagination: boolean = true;

  static getValidator() {
    return termsDataFetchingValidator;
  }

  static getType(): string {
    return "terms-data";
  }

  static clone(node: TermsDataFetchingNode): TermsDataFetchingNode {
    const newNode = new TermsDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): TermsDataFetchingNode {
    const node = $createTermsDataFetchingNode();
    node.afterImportJSON(serializedNode);
    return node;
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<
    | [z.infer<typeof termsDataFetchingValidator>, DataFetchingPagination]
    | [z.infer<typeof termsDataFetchingValidator>]
  > {
    const { actions } = serverActions;

    const { taxonomy, ...query } = this.getQuery();

    const result = await actions.term.list<"view">(taxonomy, query, {
      context: "view",
    });
    const { data: terms, info } = result;

    const termsWithIndex = terms.map((term, index) => ({
      ...term,
      index: index + 1,
    }));

    const parsed = termsDataFetchingValidator.parse(termsWithIndex);

    const parsedPagination = info?.pagination
      ? dataFetchingPaginationValidator.parse(info.pagination)
      : undefined;
    return parsedPagination ? [parsed, parsedPagination] : [parsed];
  }
}

export const $createTermsDataFetchingNode = () => {
  const node = new TermsDataFetchingNode();
  return node;
};

export const $isTermsDataFetchingNode = (
  node: unknown
): node is TermsDataFetchingNode => node instanceof TermsDataFetchingNode;
