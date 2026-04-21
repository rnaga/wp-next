import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  createActionCommand,
  createFilterCommand,
} from "@rnaga/wp-node/common/hooks-command";
import { COMMAND_PRIORITY_HIGH, createCommand, LexicalEditor } from "lexical";

type WPHooks = ReturnType<typeof useWP>["wpHooks"];
type WPActionCommand = ReturnType<typeof createActionCommand>;
type WPFilterCommand = ReturnType<typeof createFilterCommand>;

export const addWPHooksFilterCommands = (
  wpHooks: WPHooks,
  commands: WPFilterCommand[],
  callback: (command: WPFilterCommand, args: any) => any
) => {
  const removers = commands.map((command) =>
    wpHooks.filter.addCommand(command, (args) => {
      return callback(command, args);
    })
  );

  return () => {
    removers.forEach((remove) => remove());
  };
};

export const addWPHooksActionCommands = <T = any>(
  wpHooks: WPHooks,
  commands: WPActionCommand[],
  callback: (command: WPActionCommand, args: T) => void
) => {
  const removers = commands.map((command) =>
    wpHooks.action.addCommand(command, (args) => {
      callback(command, args as T);
    })
  );

  return () => {
    removers.forEach((remove) => remove());
  };
};

export const addLexicalCommands = (
  editor: LexicalEditor,
  commands: Parameters<LexicalEditor["registerCommand"]>[0][],
  callback: (
    command: Parameters<LexicalEditor["registerCommand"]>[0],
    args: any
  ) => boolean
) => {
  const removers = commands.map((command) =>
    editor.registerCommand(
      command,
      (args) => {
        return callback(command, args);
      },
      COMMAND_PRIORITY_HIGH
    )
  );

  return () => {
    removers.forEach((remove) => remove());
  };
};
