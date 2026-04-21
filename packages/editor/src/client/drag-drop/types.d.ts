import { Klass, LexicalEditor, LexicalNode } from "lexical";

export type DragDropParameters =
  | {
      isNew: true;
      dragged: Klass<LexicalNode>;
      draggedNode: LexicalNode;
      targetNode: LexicalNode;
      position: DragDropPosition;
      editor: LexicalEditor;
    }
  | {
      isNew: false;
      dragged: LexicalNode;
      draggedNode: LexicalNode;
      targetNode: LexicalNode;
      position: DragDropPosition;
      editor: LexicalEditor;
    };

export type DragDropValidator = (
  args: DragDropParameters
) => [true, LexicalNode] | [false, string | undefined];

export type DropEventHandler = (args: DragDropParameters) => boolean;

export type DragDropPosition =
  | "top"
  | "bottom"
  | "center-top"
  | "center-bottom";
