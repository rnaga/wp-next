import type * as wpTypes from "@rnaga/wp-node/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { CUSTOM_CODE_INJECT_LOCATIONS } from "../lexical/nodes/custom-code/constants";

export type CustomCode = wpCoreTypes.actions.Posts[number];

export type CustomCodes = wpCoreTypes.actions.Posts;

export type CustomCodeList = NonNullable<CustomCodes>;

export type CustomCodeTerms = wpCoreTypes.actions.Terms;

export type CustomCodeInfo = wpTypes.crud.CrudReturnType<"post", "get">["info"];

export type CustomCodeMimeType =
  | "application/javascript"
  | "text/css"
  | "text/html"
  | "text/plain";

export interface ParsedCustomCode {
  scripts: Array<{ title: string; content: string }>;
  styles: Array<{ title: string; content: string }>;
  html: Array<{ title: string; content: string }>;
}

export type CustomCodeInjectLocation =
  (typeof CUSTOM_CODE_INJECT_LOCATIONS)[number];
