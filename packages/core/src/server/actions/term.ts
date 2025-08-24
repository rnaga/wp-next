"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";
import type * as types from "../../types";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"term", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.term.create(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"term", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const [termId, options] = args;
  return await handleResponse(
    wp,
    wpCrud.term.get(termId, { ...options, context: "edit" })
  );
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"term", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.term.update(...args));
};

export const syncObject = async (
  ...args: wpTypes.crud.CrudParameters<"term", "syncObject">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.term.syncObject(...args));
};

export const list = async <T extends types.actions.ViewContext>(
  taxonomyName: wpTypes.crud.CrudParameters<"term", "list">[0],
  args: wpTypes.crud.CrudParameters<"term", "list">[1],
  options?: {
    context: T;
  }
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;

  return await handleResponse(
    wp,
    wpCrud.term.list<T>(taxonomyName, args, options)
  );
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"term", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.term.delete(...args));
};

export const taxonomies = async (
  ...args: wpTypes.crud.CrudParameters<"term", "taxonomies">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.term.taxonomies(...args));
};
