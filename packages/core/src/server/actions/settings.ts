"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"settings", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.settings.get(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"settings", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.settings.update(...args));
};
