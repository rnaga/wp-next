import { z } from "zod";

import { getPaths, getWPSession } from "@rnaga/wp-next-core/server/wp";
import { filter, hook } from "@rnaga/wp-node/decorators/hooks";

import type * as wpTypes from "@rnaga/wp-node/types";

/**
 * Represents the initialization of WP NextCore.
 */
@hook("next_admin_init")
export class NextAdminInit {
  /**
   * This hook sets site and blog IDs based on the URL path,
   * and assumes the user based on the session.
   *
   * @param args The arguments passed to the hook. (wp: Context)
   * @returns A Promise that resolves when the hook is completed.
   */
  @filter("next_core_init")
  async hookFilterProviders(
    ...args: wpTypes.hooks.FilterParameters<"next_core_init">
  ) {
    const [wp] = args;
    const session = await getWPSession();

    // Skip if not multisite or user is not logged in.
    //
    // The initial user, site and blog are already set in next-core-init (NextCoreInit).
    if (!wp.config.isMultiSite() || !session?.user.ID) {
      return wp;
    }

    const userId = session.user.ID;

    let paths = await getPaths(process.env.WPAUTH_BASE_PATH ?? "/admin");
    let blogId: number = 1;
    let siteId: number = 0;

    const parseBlogId = z.coerce.number().min(1).safeParse(paths[0]);

    if (parseBlogId.success) {
      blogId = parseBlogId.data;
      paths = paths.slice(1);
    }

    // Switch site & blog if needed
    if (wp.config.config.multisite.defaultBlogId !== blogId) {
      const blog = await wp.utils.blog.get(blogId);

      if (!blog.props) {
        throw new Error("Blog not found");
      }

      siteId = blog.props.site_id;
      await wp.current.switchSite(blog.props.site_id, blog.props.blog_id);

      // Assume user since the site has changed.
      await wp.current.assumeUser(userId);
    }

    return wp;
  }
}
