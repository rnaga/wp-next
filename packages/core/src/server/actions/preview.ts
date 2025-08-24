import { Context } from "@rnaga/wp-node/core/context";
import { WP } from "../wp";
import { createResponsePayload } from "./response";

const PREVIEW_META_KEY = "_wp_next_preview";

export const create = async (data: Record<string, any>) => {
  const wp = await WP();
  const userId = wp.current.user?.props?.ID;

  if (!userId) {
    return createResponsePayload({
      success: false,
      error: "Not permitted",
      data: undefined as never,
    });
  }

  // Generate random 8 keys
  const token = Math.random().toString(36).substring(2, 10);

  const previewData = {
    token,
    time: Date.now(),
    data,
  };

  await wp.utils.trx.meta.upsert(
    "user",
    userId,
    PREVIEW_META_KEY,
    JSON.stringify(previewData)
  );

  return createResponsePayload({
    success: true,
    error: undefined,
    data: token,
  });
};

export const get = async (token: string) => {
  const wp = await WP();

  const userId = wp.current.user?.props?.ID;

  if (!userId) {
    return createResponsePayload({
      success: false,
      error: "Not permitted",
      data: undefined,
    });
  }

  const preview = await wp.current.user?.meta.get<Record<string, any>>(
    PREVIEW_META_KEY
  );

  try {
    if (preview.token !== token || preview.time < Date.now() - 1000 * 60 * 60) {
      return createResponsePayload({
        success: false,
        error: "Invalid preview token",
        data: undefined,
      });
    }

    // Remove the preview data after it has been accessed
    await wp.utils.trx.meta.remove("user", {
      objectId: userId,
      key: PREVIEW_META_KEY,
    });

    return createResponsePayload({
      success: true,
      error: undefined,
      data: preview.data,
    });
  } catch (e) {
    return createResponsePayload({
      success: false,
      error: "Invalid preview data",
      data: undefined,
    });
  }
};
