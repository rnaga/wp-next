"use server";

import { handleResponse } from "./response";
import { WP } from "../wp";

import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"applicationPasswords", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const {
    data: { password, item },
    info,
  } = await wpCrud.applicationPasswords.create(...args);

  item.password = undefined;

  return await handleResponse(wp, { data: { password, item }, info });
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"applicationPasswords", "get">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const { data: password, info } = await wpCrud.applicationPasswords.get(
    ...args
  );

  password.password = undefined;

  return await handleResponse(wp, { data: password, info });
};

export const list = async (
  ...args: wpTypes.crud.CrudParameters<"applicationPasswords", "list">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  const { data: passwords, info } = await wpCrud.applicationPasswords.list(
    ...args
  );

  passwords.forEach((p) => {
    p.password = undefined;
  });

  return await handleResponse(wp, { data: passwords, info });
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"applicationPasswords", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.applicationPasswords.update(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"applicationPasswords", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.applicationPasswords.delete(...args));
};
