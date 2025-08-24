"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export type Site = NonNullable<Awaited<ReturnType<typeof get>>["data"]>;
export type Sites = NonNullable<Awaited<ReturnType<typeof list>>["data"]>;

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"site", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  args[1] = { subdomainInstall: wp.config.isSubdomainInstall() };
  return await handleResponse(wp, wpCrud.site.create(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"site", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.site.get(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"site", "list">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.site.list(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"site", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.site.update(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"site", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.site.delete(...args));
};

export const site = async () => {
  const wp = await WP();
  return wp.utils.crud.site;
};
