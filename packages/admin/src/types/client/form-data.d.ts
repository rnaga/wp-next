import type * as wpTypes from "@rnaga/wp-node/types";

type SiteCreate = wpTypes.crud.CrudParameters<"site", "create">[0];
type SiteUpdate = wpTypes.crud.CrudParameters<"site", "update">[1];

type BlogCreate = wpTypes.crud.CrudParameters<"blog", "create">[0];
type BlogUpdate = wpTypes.crud.CrudParameters<"blog", "update">[1];

type SettingsUpdate = wpTypes.crud.CrudParameters<"settings", "update">[0];

type RoleCreate = wpTypes.crud.CrudParameters<"roles", "create">[0];
type RoleUpdate = wpTypes.crud.CrudParameters<"roles", "update">[1];

type UserCreate = wpTypes.crud.CrudParameters<"user", "create">[0];
type UserUpdate = wpTypes.crud.CrudParameters<"user", "update">[1];

type OptionsUpdate = wpTypes.crud.CrudParameters<"options", "update">[0];

type PostUpsert = wpTypes.crud.CrudParameters<"post", "create">[0];

type TermCreate = wpTypes.crud.CrudParameters<"term", "create">[0];
type TermUpdate = wpTypes.crud.CrudParameters<"term", "update">[2];
type TermUpsert = TermCreate & TermUpdate;

type CommentCreate = wpTypes.crud.CrudParameters<"comment", "create">[0];
type CommentUpdate = wpTypes.crud.CrudParameters<"comment", "update">[1];
type CommentUpsert = CommentCreate & CommentUpdate;
