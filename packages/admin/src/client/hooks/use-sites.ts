import { useEffect, useState } from "react";

import { useWPAdmin } from "../wp-admin";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import type * as types from "../../types";
import { useAdminUser } from "./use-admin-user";
import { useAdminServerActions } from "./use-admin-server-actions";

export const useSites = (props?: { capabilities?: string[] }) => {
  const { capabilities } = props ?? {};
  const {
    wp: { globalState },
    site,
  } = useWPAdmin();
  const { actions, execute, safeParse } = useAdminServerActions();
  const { adminUser } = useAdminUser();

  const [blogs, setBlogs] = useState<types.client.AvailableBlog[]>();

  const updateSites = async () => {
    const response = await execute(actions.adminUser.getAdminCurrent());
    const result = safeParse(response);

    if (result.success) {
      globalState.set("adminUser", response.data);
    }

    return result.success;
  };

  useEffect(() => {
    if (!adminUser.availableSites.primary_blog) {
      return;
    }

    if (!site.isMultiSite) {
      setBlogs([adminUser.availableSites.primary_blog]);
      return;
    }

    const blogs: types.client.AvailableBlog[] = [];
    for (const site of adminUser.availableSites?.sites ?? []) {
      if (!site.blogs) {
        continue;
      }
      for (const blog of site?.blogs) {
        if (
          !capabilities ||
          capabilities.length ==
            blog.capabilities.filter((cap) => capabilities.includes(cap)).length
        ) {
          blogs.push(blog);
        }
      }
    }

    blogs.length > 0 && setBlogs(blogs);
  }, [adminUser.availableSites]);

  return { sites: adminUser.availableSites, blogs, updateSites };
};
