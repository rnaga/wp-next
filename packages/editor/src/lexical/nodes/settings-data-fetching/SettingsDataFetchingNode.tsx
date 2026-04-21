import { z } from "zod";

import type * as wpTypes from "@rnaga/wp-node/types";
import { settingsDataFetchingValidator } from "./settings-data-fetching-validator";
import type * as types from "../../../types";
import * as settingsActions from "@rnaga/wp-next-core/server/actions/settings";

import {
  DataFetchingNode,
  SerializedDataFetchingNode,
} from "../data-fetching/DataFetchingNode";
import { postDataFetchingValidator } from "../post-data-fetching/post-data-fetching-validator";

type Data = wpTypes.crud.CrudReturnType<"settings", "get">["data"];

// type commentDataFetchingQuery = DataFetchingQuery<{
//   commentId: number;
// }>;

export const ALLOWED_QUERY_PASSTHROUGH_KEYS = [];

export class SettingsDataFetchingNode extends DataFetchingNode<{}, Data> {
  static getValidator() {
    return settingsDataFetchingValidator;
  }

  static getType(): string {
    return "settings-data";
  }

  static clone(node: SettingsDataFetchingNode): SettingsDataFetchingNode {
    const newNode = new SettingsDataFetchingNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  // decorate(editor: LexicalEditor, config: EditorConfig) {
  //   return <DataDecorator node={this} />;
  // }

  static importJSON(
    serializedNode: SerializedDataFetchingNode
  ): SettingsDataFetchingNode {
    const node = $createSettingsDataFetchingNode();
    node.afterImportJSON(serializedNode);
    node.__type = SettingsDataFetchingNode.getType();
    return node;
  }

  exportJSON(): SerializedDataFetchingNode {
    return {
      ...super.exportJSON(),
    };
  }

  async fetch(
    serverActions: types.DataServerActions
  ): Promise<[z.infer<typeof settingsDataFetchingValidator> | undefined]> {
    const { actions, parse } = serverActions;

    const result = await settingsActions.get().then(parse);
    const [settings] = result;

    const parsed = settingsDataFetchingValidator.parse(settings);
    return [parsed];
  }
}

export const $createSettingsDataFetchingNode = () => {
  const node = new SettingsDataFetchingNode();
  return node;
};

export const $isSettingsDataFetchingNode = (
  node: unknown
): node is SettingsDataFetchingNode => node instanceof SettingsDataFetchingNode;
