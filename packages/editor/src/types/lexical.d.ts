import { Klass, LexicalNode } from "lexical";

export type WPLexicalNodeRegistry = Set<
  [Klass<LexicalNode>, (...args: any[]) => any, React.ComponentType<any>]
>;
