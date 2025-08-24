import { useState } from "react";

import type * as types from "../../types";
import { getServerActionsUtils } from "../../server/utils/get-server-actions-utils";

export const useServerActions = () => {
  const [loading, setLoading] = useState(false);
  const { parse, safeParse, actions } = getServerActionsUtils();

  // const parse = <T extends types.actions.ReponsePayload<T>>(response: T) => {
  //   if (!response.success || !response.data) {
  //     throw new Error(response.error ?? "Unknown error");
  //   }

  //   const data = response.data;
  //   const info = response.info;

  //   return [data, info] as [NonNullable<T["data"]>, T["info"]];
  // };

  // const safeParse = <T extends types.actions.ReponsePayload<T>>(
  //   response: T
  // ) => {
  //   const success = response.success && !!response.data;

  //   const data = response.data as NonNullable<T["data"]>;
  //   const info = response.info;

  //   if (success === true) {
  //     return { success, data, info } as {
  //       success: true;
  //       data: NonNullable<T["data"]>;
  //       info: typeof info;
  //       error: never;
  //     };
  //   }

  //   return {
  //     success: false,
  //     error: response.error ?? "Unknwon error",
  //   } as {
  //     success: false;
  //     data: never;
  //     info: never;
  //     error: string;
  //   };
  // };

  const execute = async <T extends { data: any; info: any }>(
    serverAction: Promise<T>
  ) => {
    setLoading(true);
    const response = await serverAction;
    setLoading(false);

    return response as unknown as types.actions.ReponsePayload<T>;
  };

  return { actions, execute, loading, parse, safeParse };
};
