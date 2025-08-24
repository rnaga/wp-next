import { redirect } from "next/navigation";

import { WP } from "@rnaga/wp-next-core/server/wp";
import { AuthError } from "@rnaga/wp-next-core/client/components/auth";

export const RootPage = async () => {
  const wp = await WP();

  if (wp.config.isMultiSite()) {
    const userId = wp.current.user?.props?.ID;

    if (!userId) {
      return (
        <AuthError
          error="User not found. Please login with a different account."
          showLogoutLink={true}
        />
      );
    }

    const blogs = await wp.utils.user.getBlogs(userId);
    if (0 >= blogs.length) {
      return (
        <AuthError
          error="You are not allowed to access this page. Logout and login again if you think this is a mistake."
          showLogoutLink={true}
        />
      );
    }

    return redirect(
      `${process.env.WPAUTH_BASE_PATH}/${blogs[0].blog_id}/dashboard`
    );
  }

  redirect(`${process.env.WPAUTH_BASE_PATH}/dashboard`);
};
