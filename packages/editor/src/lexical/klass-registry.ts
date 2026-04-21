import { Klass, LexicalNode } from "lexical";

const klassNodes: Klass<LexicalNode>[] = [];

export const getKlassNodes = () => klassNodes;

export const registerKlassNode = (klass: Klass<LexicalNode>) => {
  if (!klassNodes.includes(klass)) {
    klassNodes.push(klass);
  }
};
