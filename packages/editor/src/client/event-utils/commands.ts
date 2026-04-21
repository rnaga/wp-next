import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  createActionCommand,
  createFilterCommand,
} from "@rnaga/wp-node/common/hooks-command";
import { COMMAND_PRIORITY_HIGH, createCommand, LexicalEditor } from "lexical";

type WPHooks = ReturnType<typeof useWP>["wpHooks"];
type WPActionCommand = ReturnType<typeof createActionCommand>;
type WPFilterCommand = ReturnType<typeof createFilterCommand>;

export const registerLexicalCommands = (
  editor: LexicalEditor,
  commands: ReturnType<typeof createCommand>[],
  callback: (args: any) => boolean,
  priority = COMMAND_PRIORITY_HIGH
) => {
  const removers = commands.map((command) =>
    editor.registerCommand(
      command,
      (args) => {
        return callback(args);
      },
      priority as any
    )
  );

  return () => {
    removers.forEach((remove) => remove());
  };
};

export const registerLexicalCommand = <T>(
  editor: LexicalEditor,
  command: ReturnType<typeof createCommand<T>>,
  callback: (payload: T) => boolean,
  priority = COMMAND_PRIORITY_HIGH
) => {
  return editor.registerCommand(
    command,
    (payload: T) => {
      return callback(payload);
    },
    priority as any
  );
};
