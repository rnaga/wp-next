import { ReactElement } from "react";
import { WPLexicalNode } from "../../lexical/nodes/wp";

export {};
declare module "@rnaga/wp-next-core/types/hooks/filters.d" {
  export interface Filters {
    next_editor_mousetool_menu: (
      menus: (string | ReactElement)[],
      node: WPLexicalNode
    ) => (string | ReactElement)[];

    next_editor_form_handler_name: (
      nameDescription: { name: string; description: string }[]
    ) => { name: string; description: string }[];
    next_editor_form_load: (
      ReactElements: Promise<ReactElement>[],
      formId: string,
      formHandlerType: string,
      messageClassName: string
    ) => Promise<ReactElement>[];
  }
}
