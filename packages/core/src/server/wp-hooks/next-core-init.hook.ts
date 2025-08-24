import { getWPSession } from "../..//server/wp";
import { filter, hook } from "@rnaga/wp-node/decorators/hooks";

import type * as wpTypes from "@rnaga/wp-node/types";

/**
 * Represents the initialization of WP NextCore.
 *
 * Represents a hook that sets site and blog IDs based on the URL path,
 * and assumes the user based on the session.
 */
@hook("next_core_init")
export class NextCoreInit {
  /**
   * This hook sets site and blog IDs based on the URL path,
   * and assumes the user based on the session.
   *
   * @param args The arguments passed to the hook. (wp: Context)
   * @returns A Promise that resolves when the hook is completed.
   */
  @filter("next_core_init", 1)
  async hookFilterProviders(
    ...args: wpTypes.hooks.FilterParameters<"next_core_init">
  ) {
    const [wp] = args;
    const session = await getWPSession();

    let blogId: number = 1;
    let siteId: number = 0;

    if (wp.config.isMultiSite()) {
      blogId = wp.config.config.multisite.defaultBlogId;
      siteId = wp.config.config.multisite.defaultSiteId;

      // Check if blog exists
      const blog = await wp.utils.blog.get(blogId);
      if (!blog.props) {
        throw new Error("Blog not found");
      }

      await wp.current.switchSite(blog.props.site_id, blog.props.blog_id);
    }

    // Assume user based on session
    if (session?.user.ID) {
      const user = await wp.utils.user.get(session.user.ID);
      await wp.current.assumeUser(user);
    } else {
      // Anonymous user when not logged in
      await wp.current.assumeUser();
    }

    return wp;
  }
}
