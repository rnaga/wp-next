import type { URLQueryCacheData } from "./url";
import type { TEMPLATE_ERROR_STATUS_TYPES } from "../lexical/constants";
import type { CacheData } from "../lexical/nodes/cache/CacheNode";

export type WPPageStatusType =
  | (typeof TEMPLATE_ERROR_STATUS_TYPES)[number]
  | "VALID";

export type WpPageArgs = {
  /**
   * The template identifier used to load the corresponding Lexical editor content.
   * Accepts either a post slug (string) or post ID (number/string) from wp_post.ID.
   * The identifier is tied to a specific template stored in the database/filesystem
   * that contains the serialized Lexical editor state (nodes, formatting, structure).
   * The template defines the entire page layout and content structure including:
   * - Layout components (containers, sections, columns)
   * - Content nodes (text, images, widgets)
   * - Data-fetching nodes that query dynamic content
   * - Interactive elements (forms, animations)
   * Example: "home-page", "about-us", "blog-post-template" or "123", "456"
   */
  idOrSlug: string | number;
  /**
   * Optional dynamic URL path parameters from Next.js routing.
   * Array of path segments that can be parsed according to the template configuration.
   * These are typically used with Next.js dynamic routes (e.g., [slug], [...slug]).
   * The params are processed by parseParamsAndSearchParams() using the template's
   * configuration to extract structured data for the page.
   * Example: ["blog", "my-post-slug"] or ["category", "tech", "page", "2"]
   */
  params?: string[];
  /**
   * Optional URL search/query parameters from Next.js routing.
   * Key-value pairs from the URL query string (e.g., ?category=tech&page=1).
   * These are processed by parseParamsAndSearchParams() using the template's
   * configuration and merged with urlQuery to provide dynamic data to nodes.
   * Example: { category: "tech", page: "1", sort: "date" }
   */
  searchParams?: Record<string, string>;
  /**
   * Optional dynamic URL query parameters passed to the page at runtime.
   * These parameters are primarily consumed by DataFetchingNode and other
   * nodes that require dynamic data based on the current page context.
   * The urlQuery is stored in the CacheNode and becomes accessible to ALL
   * nested widget editors throughout the Lexical editor hierarchy.
   *
   * Structure: URLQueryCacheData = Record<string, Record<string, any>>
   * - First-level key: dataName (must match the dataName in DataFetchingNode)
   * - Second-level key-value pairs: query parameters for that specific node
   *
   * Common use cases:
   * - Filtering posts by category/tag in PostsDataFetchingNode
   * - Loading specific post data by ID in DataFetchingNode
   * - Conditional rendering based on query parameters
   * - Pagination parameters (page, limit, offset)
   *
   * Example:
   * {
   *   "blog-posts": { category: "tech", page: "1", limit: "10" },
   *   "featured-post": { postId: "123", include: "author,comments" },
   *   "product-list": { tag: "featured", sort: "price" }
   * }
   *
   * Each DataFetchingNode with dataName="blog-posts" will receive
   * { category: "tech", page: "1", limit: "10" } as its query parameters.
   */
  urlQuery?: URLQueryCacheData;

  // This is an internal field used to pass cached data to the server component during rendering.
  // The data structure should be a mapping of node keys to their corresponding data fetching node (e.g. post-data)
  // and the query cache data for that node.
  cacheData?: CacheData;

  /**
   * Optional key for preview mode. When provided, it is forwarded to `getWpPage`
   * which bypasses the publish-status check, allowing unpublished templates to be
   * rendered via `/admin/:id/full-preview`. The key is further passed to
   * `processAndGetTemplate` for access-controlled preview data resolution.
   */
  previewInfoKey?: string;
};
