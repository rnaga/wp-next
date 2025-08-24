import { z } from "zod";

import * as actionsBlog from "../server/actions/blog";
import * as actionsComment from "../server/actions/comment";
import * as actionsMeta from "../server/actions/meta";
import * as actionsOptions from "../server/actions/options";
import * as actionsPost from "../server/actions/post";
import * as actionsRevision from "../server/actions/revision";
import * as actionsRoles from "../server/actions/roles";
import * as actionsSettings from "../server/actions/settings";
import * as actionsSite from "../server/actions/site";
import * as actionsTerm from "../server/actions/term";
import * as actionsUser from "../server/actions/user";
import * as actionsMedia from "../server/actions/media";
import * as actionsAdminUser from "../server/actions/admin-user";

import type * as wpTypes from "@rnaga/wp-node/types";

export type ErrorResponsePayload = {
  success: false;
  error: string | undefined;
  data: never;
  info: never;
};

export type ReponsePayload<T extends { data: any; info: any }> =
  | ErrorResponsePayload
  | {
      success: true;
      error: undefined;
      data: NonNullable<T["data"]>;
      info: T["info"] | undefined;
    };

export type ActionResponse<T extends (...args: any) => any> = Awaited<
  ReturnType<T>
>;

// Server Actions
export interface Actions {
  adminUser: typeof actionsAdminUser;
  blog: typeof actionsBlog;
  meta: typeof actionsMeta;
  options: typeof actionsOptions;
  post: typeof actionsPost;
  roles: typeof actionsRoles;
  site: typeof actionsSite;
  term: typeof actionsTerm;
  revision: typeof actionsRevision;
  settings: typeof actionsSettings;
  user: typeof actionsUser;
  comment: typeof actionsComment;
  media: typeof actionsMedia;
}

type ResponseType<
  T extends keyof Actions,
  TOperation extends keyof Actions[T],
  TKey extends "data" | "info"
> = Actions[T][TOperation] extends (...args: any) => any
  ? ActionResponse<Actions[T][TOperation]>[TKey]
  : never;

type ResponseData<
  T extends keyof Actions,
  TOperation extends keyof Actions[T]
> = ResponseType<T, TOperation, "data">;

type NonNullableResponseData<
  T extends keyof Actions,
  TOperation extends keyof Actions[T]
> = NonNullable<ResponseData<T, TOperation>>;

type ResponseInfo<
  T extends keyof Actions,
  TOperation extends keyof Actions[T]
> = ResponseType<T, TOperation, "info">;

type UserResponseData = ResponseData<"user", "list">;

type ActionsParameters<
  T extends keyof Actions,
  TOperation extends keyof Actions[T]
> = Actions[T][TOperation] extends (...args: any) => any
  ? Parameters<Actions[T][TOperation]>
  : never;

export type SearchQuery<
  T extends Extract<
    keyof wpTypes.crud.CrudComponents,
    | "blog"
    | "comment"
    | "post"
    | "revision"
    | "roles"
    | "site"
    | "term"
    | "user"
  >
> = T extends "revision" | "term"
  ? wpTypes.crud.CrudParameters<T, "list">[1]
  : wpTypes.crud.CrudParameters<T, "list">[0];

type ViewContext = "view" | "edit" | "embed";

export type CrudUserListContext = NonNullable<
  NonNullable<wpTypes.crud.CrudParameters<"user", "list">[1]>["context"]
>;

export type UserListResponse<T extends ViewContext = "view"> = Awaited<
  ReturnType<typeof actionsUser.list<T>>
>;

type RoleEditableBlogs = NonNullable<
  Awaited<ReturnType<Actions["adminUser"]["getRoleEditableBlogs"]>>["data"]
>;

type RoleAdditiveBlogs = NonNullable<
  Awaited<ReturnType<Actions["adminUser"]["getRoleAdditiveBlogs"]>>["data"]
>;

type Blog = NonNullableResponseData<"blog", "get">;
type Blogs = NonNullableResponseData<"blog", "list">;

type Comment = NonNullableResponseData<"comment", "get">;
type Comments = NonNullableResponseData<"comment", "list">;
type CommentsInfo = ResponseInfo<"comment", "list">;

type Post = NonNullableResponseData<"post", "get">;
type PostUpsert = wpTypes.crud.CrudReturnType<"post", "getAsUpsert">["data"];
type Posts = NonNullableResponseData<"post", "list">;
type PostsInfo = ResponseInfo<"post", "list">;

type Taxonomies = NonNullableResponseData<"term", "taxonomies">;
type Term = NonNullableResponseData<"term", "get">;
type Terms = NonNullableResponseData<"term", "list">;
type TermsInfo = ResponseInfo<"term", "list">;

type User = NonNullableResponseData<"user", "get">;
type Users = NonNullable<NonNullable<UserListResponse<"view">>["data"]>;
type UserBlogs = NonNullableResponseData<"user", "getBlogs">;
type UsersEdit = NonNullable<NonNullable<UserListResponse<"edit">>["data"]>;
type UsersEditInfo = NonNullable<UserListResponse<"edit">>["info"];

type Options = NonNullableResponseData<"options", "getAll">;

type Revision = NonNullableResponseData<"revision", "get">;
type Revisions = NonNullableResponseData<"revision", "list">;
type RevisionsInfo = ResponseInfo<"revision", "list">;

type Site = NonNullableResponseData<"site", "get">;
type Sites = NonNullableResponseData<"site", "list">;

type Settings = NonNullableResponseData<"settings", "get">;

// type RoleEditableBlogs = NonNullable<
//   Awaited<ReturnType<Actions["user"]["getRoleEditableBlogs"]>>["data"]
// >;

// type RoleAdditiveBlogs = NonNullable<
//   Awaited<ReturnType<Actions["user"]["getRoleAdditiveBlogs"]>>["data"]
// >;
