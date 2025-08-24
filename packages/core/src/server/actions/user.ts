"use server";

import { User } from "@rnaga/wp-node/core/user";

import { createResponsePayload, handleResponse } from "./response";
import { WP } from "../wp";

import type * as types from "../../types";
import type * as wpTypes from "@rnaga/wp-node/types";

export const create = async (
  ...args: wpTypes.crud.CrudParameters<"user", "create">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  args[0] = { ...args[0], role: undefined };
  return await handleResponse(wp, wpCrud.user.create(...args));
};

export const get = async (
  ...args: wpTypes.crud.CrudParameters<"user", "getAsUpsert">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.getAsUpsert(...args));
};

export const getAvailableSites = async (
  ...args: wpTypes.crud.CrudParameters<"user", "getAvailableSites">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.getAvailableSites(...args));
};

export const getBlogs = async (
  ...args: wpTypes.crud.CrudParameters<"user", "getBlogs">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.getBlogs(...args));
};

export const getCurrent = async () => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user?.props) {
    return createResponsePayload({
      success: false,
      error: "User not logged in",
      data: undefined as never,
    });
  }

  const role = await user.role();

  // User not logged in
  if (role.is("anonymous")) {
    return createResponsePayload({
      success: true,
      data: undefined as never,
    });
  }

  const { user_pass, user_activation_key, ...partialUser } = user.props;

  const currentUser = {
    ...partialUser,
    role: {
      names: role.names,
      capabilities: role.capabilities,
    },
  };

  return createResponsePayload({
    success: true,
    error: undefined,
    data: currentUser,
  });
};

export const list = async <T extends types.actions.ViewContext>(
  args: wpTypes.crud.CrudParameters<"user", "list">[0],
  options?: {
    context: T;
  }
) => {
  const wp = await WP();

  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.list<T>(args, options));
};

export const update = async (
  ...args: wpTypes.crud.CrudParameters<"user", "update">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  args[2] = { ...args[2], attachRole: false, removeRole: false };
  return await handleResponse(wp, wpCrud.user.update(...args));
};

export const updatePassword = async (
  ...args: wpTypes.crud.CrudParameters<"user", "updatePassword">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.updatePassword(...args));
};

export const updateRole = async (
  ...args: wpTypes.crud.CrudParameters<"user", "updateRole">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.updateRole(...args));
};

export const updateSuperAdmin = async (
  ...args: wpTypes.crud.CrudParameters<"user", "updateSuperAdmin">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.updateSuperAdmin(...args));
};

export const del = async (
  ...args: wpTypes.crud.CrudParameters<"user", "delete">
) => {
  const wp = await WP();
  const wpCrud = wp.utils.crud;

  return await handleResponse(wp, wpCrud.user.delete(...args));
};

export const can = async <T extends string>(
  action?: T,
  ...args: wpTypes.TMapMetaCapArgs<T>
) => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user) {
    return createResponsePayload({
      success: false,
      error: "User not logged in",
      data: undefined,
    });
  }

  const hasPermission = await user.can(action, ...args);

  return createResponsePayload({
    success: hasPermission,
    error: hasPermission ? undefined : "Not Permitted",
    data: hasPermission,
  });
};

export const bulkCan = async (...args: Parameters<User["bulkCan"]>) => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user) {
    return createResponsePayload({
      success: false,
      error: "User not logged in",
      data: undefined,
    });
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: await user.bulkCan(...args),
  });
};
