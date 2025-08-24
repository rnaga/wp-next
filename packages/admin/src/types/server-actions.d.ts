import * as actionsDashboard from "../server/actions/dashboard";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

declare module "@rnaga/wp-next-core/types/server-actions.d" {
  export interface Actions {
    dashboard: typeof actionsDashboard;
  }
}

// Server Actions
export type Actions = {
  dashboard: typeof actionsDashboard;
};

type DashBoard = {
  counts: wpCoreTypes.actions.ResponseData<"dashboard", "counts">;
  activity: wpCoreTypes.actions.ResponseData<"dashboard", "activity">;
  activityInfo: wpCoreTypes.actions.ResponseInfo<"dashboard", "activity">;
  postDrafts: wpCoreTypes.actions.ResponseData<"post", "list">;
};
