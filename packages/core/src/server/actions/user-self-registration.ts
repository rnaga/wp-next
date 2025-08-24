"use server";
import { handleResponse, createResponsePayload } from "./response";
import { WP } from "../wp";
import type * as wpTypes from "@rnaga/wp-node/types";

import { googleRecaptcha } from "../utils/google-recaptcha";

export const canSignup = async (
  ...args: wpTypes.crud.CrudParameters<"userSelfRegistration", "canSignup">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;
  return await handleResponse(
    wp,
    wpCrud.userSelfRegistration.canSignup(...args)
  );
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"userSelfRegistration", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;
  return await handleResponse(wp, wpCrud.userSelfRegistration.update(...args));
};

export const register = async (
  args: wpTypes.crud.CrudParameters<"userSelfRegistration", "register">[0],
  googleRecaptchaToken?: string
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  // Verify google recaptch v3
  const verifyToken = await googleRecaptcha.verifyToken(googleRecaptchaToken);
  if (!verifyToken) {
    return createResponsePayload({
      data: false,
      success: false,
      error: "Failed to verify reCAPTCHA token",
    });
  }

  return await handleResponse(wp, wpCrud.userSelfRegistration.register(args));
  //return { success: true, error: undefined };
};

export const activate = async (
  ...args: wpTypes.crud.CrudParameters<"userSelfRegistration", "activate">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;
  return await handleResponse(
    wp,
    wpCrud.userSelfRegistration.activate(...args)
  );
};
