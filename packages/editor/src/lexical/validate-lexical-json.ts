import { createLexicalEditor } from "./editor";

/**
 * Validates a Lexical editor-state JSON string.
 *
 * Two checks are performed in order:
 * 1. JSON syntax — JSON.parse must succeed.
 * 2. Lexical structure — all node types in the JSON must be registered.
 *    A temporary editor is used so the live editor is never mutated.
 *    onError re-throws because Lexical's parseEditorState internally catches
 *    errors and only calls onError without re-throwing. The default onError in
 *    getLexicalEditorConfig also throws, so this override is redundant but kept
 *    for clarity.
 *
 * Returns the canonically stringified JSON on success, throws on any error.
 */
export const validateLexicalJson = (content: string): string => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }

  const stringified = JSON.stringify(parsed);

  const tmpEditor = createLexicalEditor({
    onError: (e) => {
      throw e;
    },
  });
  tmpEditor.parseEditorState(stringified);

  return stringified;
};
