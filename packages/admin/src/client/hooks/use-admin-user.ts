import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const useAdminUser = () => {
  const { globalState } = useWP();

  const { actions, safeParse } = useServerActions();

  const user = useUser();

  const updateAdminUser = async () => {
    const response = await actions.adminUser.getAdminCurrent().then(safeParse);
    if (response.success) {
      globalState.set("adminUser", response.data);
    }
  };

  return {
    ...user,
    updateAdminUser,
    adminUser: globalState.get("adminUser"),
  };
};
