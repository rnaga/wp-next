import { getDefaultAdminHooks } from "@rnaga/wp-next-admin/server/utils";

import { AdminMediaHook } from "./admin-media.hook";
import { NextAuthProvidersHook } from "./nextauth-providers.hook";
import { NotificationsHook } from "./notifications.hook";

export const hooks = [
  ...getDefaultAdminHooks(),
  AdminMediaHook,
  NextAuthProvidersHook,
  NotificationsHook,
];
