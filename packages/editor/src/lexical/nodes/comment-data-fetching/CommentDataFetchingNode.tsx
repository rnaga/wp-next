import { z } from "zod";

import type * as wpTypes from "@rnaga/wp-node/types";
import { commentDataFetchingValidator } from "./comment-data-fetching-validator";
import type * as types from "../../../types";

import {
  DataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { postDataFetchingValidator } from "../post-data-fetching/post-data-fetching-validator";

type Data = wpTypes.crud.CrudReturnType<"comment", "get">["data"];

// type commentDataFetchingQuery = DataFetchingQuery<{
//   commentId: number;
// }>;

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = ["ID"];

export class CommentDataFetchingNode extends DataFetchingNode<
  {
    ID: number;
  },
  Data
> {
  static getValidator() {
    return commentDataFetchingValidator;
  }

  static getType(): string {
    return "comment-data";
  }

  static clone(node: CommentDataFetchingNode): CommentDataFetchingNode {
    const newNode = new CommentDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  // decorate(editor: LexicalEditor, config: EditorConfig) {
  //   return <DataDecorator node={this} />;
  // }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): CommentDataFetchingNode {
    const node = $createCommentDataFetchingNode();
    node.afterImportJSON(serializedNode);
    node.__type = CommentDataFetchingNode.getType();
    return node;
  }

  exportJSON(): SerializedDataFetchingNode {
    return {
      ...super.exportJSON(),
    };
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<[z.infer<typeof commentDataFetchingValidator> | undefined]> {
    const { actions, parse } = serverActions;

    let commentId = this.__query?.ID;

    if (!commentId) {
      return [undefined];
    }

    const result = await actions.comment.get(commentId).then(parse);
    const [comment] = result;
    const parsed = commentDataFetchingValidator.parse(comment);
    return [parsed];
  }
}

export const $createCommentDataFetchingNode = () => {
  const node = new CommentDataFetchingNode();
  return node;
};

export const $isCommentDataFetchingNode = (
  node: unknown
): node is CommentDataFetchingNode => node instanceof CommentDataFetchingNode;
