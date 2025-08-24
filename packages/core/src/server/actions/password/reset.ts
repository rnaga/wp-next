"use server";

import { createResponsePayload } from "../response";
import { WP } from "../../wp";

export const reset = async (args: {
  newPassword: string;
  userLogin: string;
  resetKey: string;
}) => {
  const { newPassword, userLogin, resetKey } = args;

  const wp = await WP();

  let error = "Failed to reset password";
  try {
    let result = await wp.utils.user.checkPasswordResetKey(resetKey, userLogin);

    if (!result) {
      return createResponsePayload({
        success: false,
        error,
        data: false,
      });
    }

    const user = await wp.utils.user.get(userLogin);
    await wp.utils.user.resetPassword(user, newPassword);
    return createResponsePayload({
      success: true,
      error: "",
      data: true,
    });
  } catch (e) {
    error = `Error: ${e}`;
  }

  return createResponsePayload({
    success: false,
    error,
    data: false,
  });
};
