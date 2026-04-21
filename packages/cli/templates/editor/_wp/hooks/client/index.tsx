"use client";

import { getDefaultAdminHooks } from "@rnaga/wp-next-admin/client/utils";
import { hooks as editorHooks } from "@rnaga/wp-next-editor/client/wp-hooks";
import { hooks as editorFormHooks } from "@rnaga/wp-next-editor/lexical/nodes/form/wp-hooks";

export const hooks = [
  ...getDefaultAdminHooks(),
  ...editorHooks,
  ...editorFormHooks,
];
