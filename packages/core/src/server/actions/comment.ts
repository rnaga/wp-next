"use server";
import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"comment", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.comment.create(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"comment", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.comment.get(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"comment", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const [commentId, data] = args;
  return await handleResponse(
    wp,
    wpCrud.comment.update(commentId, { ...data, comment_type: "comment" })
  );
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"comment", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.comment.delete(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"comment", "list">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const [queryParams, options] = args;
  return await handleResponse(
    wp,
    wpCrud.comment.list(queryParams, { ...options, limitChildren: 10 })
  );
};
