import { z } from "zod";

import type * as wpTypes from "@rnaga/wp-node/types";
import { postDataFetchingValidator } from "./post-data-fetching-validator";
import type * as types from "../../../types";

import {
  DataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";

type Data = wpTypes.crud.CrudReturnType<"post", "get">["data"] & {
  postType?: wpTypes.PostType;
};

// type PostDataFetchingQuery = DataFetchingQuery<{
//   postId: number;
// }>;

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = ["ID", "slug"];

export class PostDataFetchingNode extends DataFetchingNode<
  {
    ID: number;
    slug?: string;
    postType?: wpTypes.PostType;
  },
  Data
> {
  static getValidator() {
    return postDataFetchingValidator;
  }

  static getType(): string {
    return "post-data";
  }

  static clone(node: PostDataFetchingNode): PostDataFetchingNode {
    const newNode = new PostDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  // decorate(editor: LexicalEditor, config: EditorConfig) {
  //   return <DataDecorator node={this} />;
  // }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): PostDataFetchingNode {
    const node = $createPostDataFetchingNode();
    node.afterImportJSON(serializedNode);
    node.__type = PostDataFetchingNode.getType();
    return node;
  }

  exportJSON(): SerializedDataFetchingNode {
    return {
      ...super.exportJSON(),
    };
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<[z.infer<typeof postDataFetchingValidator> | undefined]> {
    const { actions, parse } = serverActions;

    // slug will be passed through URL so we can fetch by slug as well
    const postIdOrSlug = this.__query?.slug ?? this.__query?.ID;

    if (!postIdOrSlug) {
      return [undefined];
    }

    const postType = this.__query?.postType || "post";

    const result = await actions.post
      .getPublic(postIdOrSlug, {
        context: "view",
        postType,
      })
      .then(parse);

    const [post] = result;
    const parsed = postDataFetchingValidator.parse(post);

    return [parsed];
  }
}

export const $createPostDataFetchingNode = () => {
  const node = new PostDataFetchingNode();
  return node;
};

export const $isPostDataFetchingNode = (
  node: unknown
): node is PostDataFetchingNode => node instanceof PostDataFetchingNode;
