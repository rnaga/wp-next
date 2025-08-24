"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

const publicOptionNames = ["blogname", "siteurl", "home"] as const;

export const getPublic = async <T = string>(
  name: (typeof publicOptionNames)[number]
) => {
  const wp = await WP();

  if (!publicOptionNames.includes(name)) {
    return undefined;
  }

  return await handleResponse(
    wp,
    wp.options
      .get(name)
      .then((value) => ({ data: value as T | undefined, info: undefined }))
  );
};

export const getAll = async (
  ...args: wpTypes.crud.CrudParameters<"options", "getAll">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.options.getAll(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"options", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.options.update(...args));
};
