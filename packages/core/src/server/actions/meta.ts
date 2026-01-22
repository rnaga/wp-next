"use server";

import { WP } from "../wp";
import { createResponsePayload, handleResponse } from "./response";

import type * as wpTypes from "@rnaga/wp-node/types";

type KeyType = wpTypes.crud.CrudParameters<"meta", "get">[0];

const publicMetaKeys: Record<KeyType, string[]> = {
  post: [
    "_wp_next_attached_file",
    "_wp_attachment_metadata",
    "_wp_attachment_image_alt",
    "_thumbnail_id",
  ],
  blog: [],
  comment: [],
  term: [],
  user: [],
  site: [],
};

const isPublicMetaKeys = (type: KeyType, keys?: string[]) => {
  return (
    keys &&
    keys.length ===
      keys.filter((key) => publicMetaKeys[type].includes(key)).length
  );
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"meta", "get">
) => {
  const wp = await WP();

  const [type, , keys] = args;

  if (!isPublicMetaKeys(type, keys)) {
    return createResponsePayload({
      success: false,
      error: "Not permitted",
      data: undefined,
    });
  }

  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.meta.get(...args));
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"meta", "list">
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;
  return await handleResponse(wp, wpCrud.meta.list(...args));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"meta", "update">
) => {
  const wp = await WP();
  const [type, objectId, keyValue] = args;

  if (isPublicMetaKeys(type, Object.keys(keyValue))) {
    const user = wp.current.user;
    if (!user || !(await user.can(`edit_${type}`, objectId))) {
      return createResponsePayload({
        success: false,
        error: "Not permitted",
        data: undefined,
      });
    }

    for (const [key, value] of Object.entries(keyValue)) {
      await wp.utils.trx.meta.upsert(type, objectId, key, value);
    }

    return createResponsePayload({
      success: true,
      error: undefined,
      data: true,
    });
  }

  const wpCrud = wp.utils.crud;
  return await handleResponse(wp, wpCrud.meta.update(...args));
};

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"meta", "create">
) => {
  const wp = await WP();
  const [type, objectId, keyValue] = args;

  if (isPublicMetaKeys(type, Object.keys(keyValue))) {
    const user = wp.current.user;
    if (!user || !(await user.can(`edit_${type}`, objectId))) {
      return createResponsePayload({
        success: false,
        error: "Not permitted",
        data: undefined,
      });
    }

    for (const [key, value] of Object.entries(keyValue)) {
      await wp.utils.trx.meta.upsert(type, objectId, key, value);
    }

    return createResponsePayload({
      success: true,
      error: undefined,
      data: true,
    });
  }

  const wpCrud = wp.utils.crud;
  return await handleResponse(wp, wpCrud.meta.create(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"meta", "delete">
) => {
  const wp = await WP();
  const [type, objectId, keys] = args;

  if (isPublicMetaKeys(type, keys)) {
    const user = wp.current.user;
    if (!user || !(await user.can(`edit_${type}`, objectId))) {
      return createResponsePayload({
        success: false,
        error: "Not permitted",
        data: undefined,
      });
    }

    for (const key of keys) {
      await wp.utils.trx.meta.remove(type, {
        objectId,
        key,
      });
    }

    return createResponsePayload({
      success: true,
      error: undefined,
      data: true,
    });
  }

  const wpCrud = wp.utils.crud;
  return await handleResponse(wp, wpCrud.meta.delete(...args));
};
