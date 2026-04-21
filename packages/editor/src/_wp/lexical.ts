import type * as types from "@rnaga/wp-next-editor/types";
import { templatePipeFunctions } from "@rnaga/wp-next-editor/lexical/template-pipe-functions";
import {
  $createWrapperNode,
  WrapperNode,
} from "@rnaga/wp-next-editor/lexical/nodes/wrapper/WrapperNode";

export const wpLexicalNodes: Set<types.WPLexicalNodeRegistry> =
  new Set<types.WPLexicalNodeRegistry>([
    //[WrapperNode, $createWrapperNode],
  ]);

export const wpLexicalTemplatePipeFunctions: Record<
  string,
  types.TemplatePipeFunction
> = {
  ...templatePipeFunctions,
};
