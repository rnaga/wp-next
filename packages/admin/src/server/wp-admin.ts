import { WP, getWPSession, getPaths } from "@rnaga/wp-next-core/server/wp";
import type * as types from "../types";

/**
 * Retrieves the WPAdmin object containing various properties related to the WP admin.
 * @returns The WPAdmin object.
 */
export const WPAdmin = async () => {
  const wp = await WP();
  const session = await getWPSession();

  if (!process.env.WPAUTH_BASE_PATH) {
    throw new Error(
      "WPAUTH_BASE_PATH is not set in the environment variables."
    );
  }

  let basePath = process.env.WPAUTH_BASE_PATH;
  let paths = await getPaths(basePath);
  let blogId: number = 1;
  let siteId: number = 0;
  let pageSegment: string = paths?.[0] ?? "default";

  let blogBasePath = basePath;

  if (wp.config.isMultiSite()) {
    blogId = wp.current.blogId;
    siteId = wp.current.siteId;

    pageSegment = paths?.[1] ?? "default";
    blogBasePath = `${basePath}/${blogId}`;
  }

  return {
    /**
     * The WP object representing the WP instance.
     */
    wp,
    /**
     * The session object containing information about the current user's session.
     */
    session,
    /**
     * The ID of the current blog.
     */
    blogId,
    /**
     * The ID of the current site.
     */
    siteId,
    /**
     * The paths object containing various paths used in the WP admin.
     */
    paths,
    /**
     * The base path of the WP admin.
     */
    basePath,
    /**
     * The base path of the current blog within the WP admin.
     */
    blogBasePath,

    /**
     * The page segment of the current path.
     */
    pageSegment: pageSegment as types.client.AdminPageSegment,
  };
};
