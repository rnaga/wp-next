"use server";

import { createResponsePayload } from "../response";
import { WP } from "../../wp";

export const requestResetKey = async (userLogin: string) => {
  const wp = await WP();

  let resetKey = "";
  try {
    resetKey = await wp.utils.user.getPasswordResetKey(userLogin);
  } catch (e) {
    resetKey = `${e}`;

    return createResponsePayload({
      success: false,
      error: `${e}`,
      data: false,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: resetKey,
  });
};
