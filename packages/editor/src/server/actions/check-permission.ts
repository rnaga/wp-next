import { WP } from "@rnaga/wp-next-core/server/wp";

export const checkPermission = async () => {
  const wp = await WP();
  const user = wp.current.user;
  const role = await user?.role();

  if (!role?.isAdmin() && !role?.is("editor") && !role?.isSuperAdmin()) {
    return false;
  }

  return true;
};
