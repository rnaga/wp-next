"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"roles", "create">
) => {
  const wp = await WP();

  return await handleResponse(wp, wp.utils.crud.roles.create(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"roles", "list">
) => {
  const wp = await WP();

  return await handleResponse(wp, wp.utils.crud.roles.list(...args));
};

export const count = async (
  ...args: wpTypes.crud.CrudParameters<"roles", "count">
) => {
  const wp = await WP();

  return await handleResponse(wp, wp.utils.crud.roles.count(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"roles", "update">
) => {
  const wp = await WP();

  return await handleResponse(wp, wp.utils.crud.roles.update(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"roles", "delete">
) => {
  const wp = await WP();

  return await handleResponse(wp, wp.utils.crud.roles.delete(...args));
};
