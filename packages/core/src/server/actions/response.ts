import { isPromise } from "../utils";

import { Context as WPContext } from "@rnaga/wp-node/core/context";
import type * as types from "../../types";

export const handleResponse = async <Data, Info>(
  wp: WPContext,
  response: Promise<{ data: Data; info: Info }> | { data: Data; info: Info }
): Promise<types.actions.ReponsePayload<{ data: Data; info: Info }>> => {
  try {
    const { data, info } = isPromise(response) ? await response : response;

    return createResponsePayload({
      success: true,
      error: undefined,
      data,
      info,
    });
  } catch (e: any) {
    console.error(e);
    const error = wp.utils.crud.parseError(e);
    return createResponsePayload({
      success: false,
      error: error.message,
    });
  }
};

export const createResponsePayload = <Data, Info>(args: {
  success: boolean;
  error?: string | undefined;
  data?: Data;
  info?: Info;
}): types.actions.ReponsePayload<{ data: Data; info: Info }> => {
  const { success, error = undefined, data, info } = args;

  if (!success || typeof data === "undefined") {
    return {
      success: false,
      error: error ?? "Unknown error",
      data: undefined as never,
      info: undefined as never,
    };
  }

  return {
    success: true,
    error: undefined,
    data: data as NonNullable<Data>,
    info: info,
  };
};

export const createErrorResponsePayload = (error: string) =>
  createResponsePayload({
    success: false,
    error,
  }) as types.actions.ErrorResponsePayload;
