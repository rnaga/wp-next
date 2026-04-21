import { LexicalNode } from "lexical";
import { WPLexicalNode } from "../../lexical/nodes/wp";

export {};
declare module "@rnaga/wp-next-core/types/hooks/actions.d" {
  export interface Actions {
    next_editor_on_edit_node: (node: WPLexicalNode) => void;
    next_editor_form_submit: (
      form: FormData,
      formId: string,
      formHandlerType: string,
      messageClassName: string
    ) => void;
  }
}
