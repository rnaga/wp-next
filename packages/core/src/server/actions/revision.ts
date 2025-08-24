"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"revision", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.revision.get(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"revision", "list">
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.revision.list(...args));
};

export const restore = async (
  ...args: wpTypes.crud.CrudParameters<"revision", "restore">
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.revision.restore(...args));
};
