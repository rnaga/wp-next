import * as actionsBlog from "../actions/blog";
import * as actionsComment from "../actions/comment";
import * as actionsMeta from "../actions/meta";
import * as actionsOptions from "../actions/options";
import { requestResetKey } from "../actions/password/request-reset-key";
import * as actionsPost from "../actions/post";
import * as actionsRevision from "../actions/revision";
import * as actionsRoles from "../actions/roles";
import * as actionsSite from "../actions/site";
import * as actionsTerm from "../actions/term";
import * as actionsUser from "../actions/user";
import * as actionsMedia from "../actions/media";
import * as actioneAdminUser from "../actions/admin-user";

import type * as types from "../../types";

export const getServerActionsUtils = () => {
  const parse = <T extends types.actions.ReponsePayload<T>>(response: T) => {
    if (!response.success || !response.data) {
      throw new Error(response.error ?? "Unknown error");
    }

    const data = response.data;
    const info = response.info;

    return [data, info] as [NonNullable<T["data"]>, T["info"]];
  };

  const safeParse = <T extends types.actions.ReponsePayload<T>>(
    response: T
  ) => {
    const success = response.success && !!response.data;

    const data = response.data as NonNullable<T["data"]>;
    const info = response.info;

    if (success === true) {
      return { success, data, info } as {
        success: true;
        data: NonNullable<T["data"]>;
        info: typeof info;
        error: never;
      };
    }

    return {
      success: false,
      error: response.error ?? "Unknwon error",
    } as {
      success: false;
      data: never;
      info: never;
      error: string;
    };
  };

  const actions = {
    adminUser: actioneAdminUser,
    site: actionsSite,
    user: actionsUser,
    blog: actionsBlog,
    media: actionsMedia,
    meta: actionsMeta,
    options: actionsOptions,
    post: actionsPost,
    revision: actionsRevision,
    roles: actionsRoles,
    term: actionsTerm,
    comment: actionsComment,
    password: { requestResetKey },
  };

  return { actions, parse, safeParse };
};
