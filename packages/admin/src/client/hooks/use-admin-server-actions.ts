import * as actionsDashboard from "../../server/actions/dashboard";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

export const useAdminServerActions = () => {
  const serverActions = useServerActions();

  const actions = {
    ...serverActions.actions,
    dashboard: actionsDashboard,
  };

  return {
    ...serverActions,
    actions,
  };
};
