"use server";

import { z } from "zod";

import { WP } from "../../wp";

export const checkResetKey = async (resetKey: string, userLogin: string) => {
  console.log(`resetKey: ${resetKey} userLogin: ${userLogin}`);
  const parsed = z
    .object({
      resetKey: z.string().trim().min(1),
      userLogin: z.string().trim().min(1),
    })
    .safeParse({ resetKey, userLogin });

  let error = "";
  let newResetKey = "";

  if (!parsed.success) {
    error = `Invalid params - ${JSON.stringify(parsed)}`;
  } else {
    const wp = await WP();

    try {
      const result = await wp.utils.user.checkPasswordResetKey(
        parsed.data.resetKey,
        parsed.data.userLogin
      );

      if (!result) {
        error = "Invalid key";
      } else {
        newResetKey = await wp.utils.user.getPasswordResetKey(
          parsed.data.userLogin
        );
      }
    } catch (e) {
      error = `Error occurred - ${e}`;
    }
  }

  return {
    error,
    resetKey: newResetKey,
    userLogin,
  };
};
