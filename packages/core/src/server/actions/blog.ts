"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"blog", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.blog.create(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"blog", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.blog.get(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"blog", "list">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.blog.list(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"blog", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.blog.update(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"blog", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.blog.delete(...args));
};
