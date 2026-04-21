import { createContext, useContext, useEffect, useState } from "react";
import { RefreshFn } from "./types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { REFRESH_COMMAND } from "./commands";
import { COMMAND_PRIORITY_HIGH } from "lexical";

export const refreshKeys = [
  "iframe",
  "template",
  "mousetool",
  "right-panel-form",
] as const;

export type RefreshKeys = (typeof refreshKeys)[number];

const Context = createContext<{
  refresh: RefreshFn;
  refreshKeys: {
    iframe: number;
    template: number;
    mousetool: number;
    ["right-panel-form"]: number;
  };
}>({} as any);

export const useRefresh = () => useContext(Context);

export const RefreshContext = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const [editor] = useLexicalComposerContext();
  const [keys, setKeysState] = useState<Record<RefreshKeys, number>>({
    iframe: 0,
    template: 0,
    mousetool: 0,
    ["right-panel-form"]: 0,
  });

  const setKeys = (keyNames?: Array<RefreshKeys>) => {
    setKeysState({
      iframe: keys.iframe + (!keyNames || keyNames?.includes("iframe") ? 1 : 0),
      template:
        keys.template + (!keyNames || keyNames?.includes("template") ? 1 : 0),
      mousetool:
        keys.mousetool + (!keyNames || keyNames?.includes("mousetool") ? 1 : 0),
      ["right-panel-form"]:
        keys["right-panel-form"] +
        (!keyNames || keyNames?.includes("right-panel-form") ? 1 : 0),
    });
  };

  const refresh = (keyNames?: Array<RefreshKeys>) => {
    setKeys(keyNames);
  };

  useEffect(() => {
    return editor.registerCommand(
      REFRESH_COMMAND,
      (keyNames) => {
        setKeys(keyNames);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return <Context value={{ refresh, refreshKeys: keys }}>{children}</Context>;
};
