import { z } from "zod";

import {
  $storeFetchedData,
  DataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { postsDataFetchingValidator } from "../posts-data-fetching/posts-data-fetching-validator";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../types";

import { TEMPLATE_POST_TYPE } from "../../constants";

type Data = wpTypes.crud.CrudReturnType<"post", "list">["data"];

export class TemplateDataFetchingNode extends DataFetchingNode<
  {
    ID: number;
  },
  Data
> {
  static getValidator() {
    return postsDataFetchingValidator;
  }

  static getType(): string {
    return "template-data";
  }

  static clone(node: TemplateDataFetchingNode): TemplateDataFetchingNode {
    const newNode = new TemplateDataFetchingNode(node.__key);
    newNode.setName(node.getName());
    newNode.__query = node.__query;
    $storeFetchedData(newNode, node.getData());
    //newNode.setData(node.getData());
    return newNode;
  }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): TemplateDataFetchingNode {
    const node = $createTemplateDataFetchingNode();
    node.afterImportJSON(serializedNode);
    //super.importJSON(serializedNode);
    return node;
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<[z.infer<typeof postsDataFetchingValidator>[number] | undefined]> {
    const { actions } = serverActions;

    const templateId = this.__query?.ID;

    if (!templateId) {
      return [undefined];
    }

    const result = await actions.post.list(
      { include: [templateId], per_page: 1 },
      { postTypes: [TEMPLATE_POST_TYPE] }
    );
    const { data: posts, info } = result;
    const parsed = postsDataFetchingValidator.parse(posts);

    return [parsed?.[0]];
  }
}

export const $createTemplateDataFetchingNode = () => {
  const node = new TemplateDataFetchingNode();
  return node;
};

export const $isTemplateDataFetchingNode = (
  node: unknown
): node is TemplateDataFetchingNode => node instanceof TemplateDataFetchingNode;
