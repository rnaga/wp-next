"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"post", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.create(...args));
};

export const getPublic = async (
  ...args: wpTypes.crud.CrudParameters<"post", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.get(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"post", "getAsUpsert">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.getAsUpsert(...args));
};

export const countByStatuses = async (postType: wpTypes.PostType = "post") => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(
    wp,
    wpCrud.post.list(
      { status_exclude: ["auto-draft"] },
      { countGroupBy: "post_status", postTypes: [postType] }
    )
  );
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"post", "list">
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;
  return await handleResponse(
    wp,
    wpCrud.post.list(
      { ...args[0], status_exclude: ["auto-draft"] },
      { ...args[1] }
    )
  );
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"post", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.update(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"post", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.delete(...args));
};

export const copy = async (
  ...args: wpTypes.crud.CrudParameters<"post", "copy">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.copy(...args));
};

export const trash = async (
  ...args: wpTypes.crud.CrudParameters<"post", "trash">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.trash(...args));
};

export const untrash = async (
  ...args: wpTypes.crud.CrudParameters<"post", "untrash">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.post.untrash(...args));
};
