"use client";
import { useWP } from "../wp";
import { useServerActions } from "./use-server-actions";
import { capabilities } from "../utils/capabilities";
import type { MapMetaCapArgs } from "../utils/capabilities";

export const useUser = () => {
  const { globalState, user } = useWP();
  const { actions, safeParse } = useServerActions();
  //const user = globalState.get("user");

  const updateUser = async () => {
    const response = await actions.user.getCurrent().then(safeParse);
    if (response.success) {
      globalState.set("user", response.data);
    }
  };

  const userCan = <T extends keyof MapMetaCapArgs>(
    action: T,
    ...args: MapMetaCapArgs[T]
  ) => capabilities(action, user, ...args);

  return {
    user,
    updateUser,
    userCan,
  };
};
