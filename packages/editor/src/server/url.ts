//"use server";
import type * as types from "../types";
import * as vals from "../validators";
import { logger } from "@rnaga/wp-next-core/server/utils/logger";

/**
 * Parses URL path segments into URLQueryCacheData using pathMapping configuration.
 * Supports 1:many mappings where a single path segment can route to multiple nodes.
 *
 * @param params - Array of path segments from the URL (e.g., ["hello-world"])
 * @param pathMapping - Nested array mapping path positions to node query configurations.
 *   Each item may include an optional `required` boolean; required enforcement is handled
 *   by the caller (parseParamsAndSearchParams with evaluateRequired:true), not here.
 * @returns URLQueryCacheData object with grouped query data by node name
 *
 * @example
 * // URL: /hello-world/
 * const params = ["hello-world"];
 * const pathMapping = [
 *   [
 *     { nodeType: "post-data", name: "post", queryKey: "slug", required: true },
 *     { nodeType: "comment-data", name: "comments", queryKey: "post_slug" }
 *   ]
 * ];
 *
 * parseParams(params, pathMapping);
 * // Returns: {
 * //   "post": { "slug": "hello-world" },
 * //   "comments": { "post_slug": "hello-world" }
 * // }
 */
export const parseParams = (
  params: string[],
  pathMapping: types.TemplateConfig["pathMapping"]
): types.URLQueryCacheData => {
  const result: types.URLQueryCacheData = {};

  logger.log( "parseParams: params =", params, "pathMapping =", pathMapping);

  for (let i = 0; i < pathMapping.length && i < params.length; i++) {
    const segmentMappings = pathMapping[i]; // Array of mappings for this segment
    const raw = params[i];
    // Path segments may arrive URL-encoded (e.g. %3A for ":"). Decode so that
    // downstream data-fetching nodes receive the plain slug that the WP API expects.
    const value = (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })();

    // Parse the value once (transforms numeric strings to numbers)
    const parsedValue = vals.url.urlParamValue.parse(value);

    // Apply the same value to all mappings in this segment
    for (const mapping of segmentMappings) {
      if (!result[mapping.name]) {
        result[mapping.name] = {};
      }
      result[mapping.name][mapping.queryKey] = parsedValue;
    }
  }

  return result;
};

/**
 * Parses URL query string parameters into URLQueryCacheData using queryMapping configuration.
 * Supports 1:many mappings where a single query parameter can route to multiple nodes.
 *
 * @param searchParams - Object containing query string key-value pairs
 * @param queryMapping - Record mapping query parameter names to arrays of node query configurations
 * @returns URLQueryCacheData object with grouped query data by node name
 *
 * @example
 * // Query String: category=news&page=5
 * const searchParams = { category: "news", page: "5" };
 * const queryMapping = {
 *   category: [{ nodeType: "posts-data", name: "posts", queryKey: "category" }],
 *   page: [{ nodeType: "posts-data", name: "posts", queryKey: "page" }]
 * };
 *
 * parseSearchParams(searchParams, queryMapping);
 * // Returns: { "posts": { category: "news", page: 5 } }
 *
 * @example
 * // 1:many mapping - same query param routes to multiple nodes
 * const queryMapping = {
 *   slug: [
 *     { nodeType: "post-data", name: "post", queryKey: "slug" },
 *     { nodeType: "comment-data", name: "comments", queryKey: "post_slug" }
 *   ]
 * };
 * // Returns: { "post": { slug: "hello-world" }, "comments": { post_slug: "hello-world" } }
 */
export const parseSearchParams = (
  searchParams: Record<string, string>,
  queryMapping: types.TemplateConfig["queryMapping"]
): types.URLQueryCacheData => {
  const result: types.URLQueryCacheData = {};

  for (const [paramName, paramValue] of Object.entries(searchParams)) {
    const mappings = queryMapping[paramName];

    if (!mappings || mappings.length === 0) {
      continue;
    }

    // Parse the value once (transforms numeric strings to numbers)
    const parsedValue = vals.url.urlParamValue.parse(paramValue);

    // Apply the same value to all mappings for this query parameter
    for (const mapping of mappings) {
      if (!result[mapping.name]) {
        result[mapping.name] = {};
      }
      result[mapping.name][mapping.queryKey] = parsedValue;
    }
  }

  return result;
};

/**
 * Parses both URL path segments and query string parameters into URLQueryCacheData
 * Combines results from both pathMapping and queryMapping configurations
 *
 * @param config - Configuration object containing params, searchParams, templateConfig, and evaluateRequired
 * @param config.evaluateRequired - When true, throws a "not found" error if any mapping item with
 *   `required: true` is missing from the URL. This should be true for public (non-admin) pages only.
 *   Admin pages (/admin/*) should pass false or omit this flag.
 * @returns URLQueryCacheData object with merged query data from both sources
 * @throws When evaluateRequired is true and a required pathMapping segment or queryMapping key is absent
 *
 * @example
 * // URL: /hello-world/?page=2
 * parseParamsAndSearchParams({
 *   params: ["hello-world"],
 *   searchParams: { "page": "2" },
 *   templateConfig: {
 *     pathMapping: [
 *       [
 *         { nodeType: "post-data", name: "post", queryKey: "slug", required: true },
 *         { nodeType: "comment-data", name: "comments", queryKey: "post_slug" }
 *       ]
 *     ],
 *     queryMapping: {
 *       "page": [{ nodeType: "comment-data", name: "comments", queryKey: "page" }]
 *     }
 *   },
 *   evaluateRequired: true
 * });
 * // Returns: {
 * //   "post": { slug: "hello-world" },
 * //   "comments": { post_slug: "hello-world", page: 2 }
 * // }
 */
export const parseParamsAndSearchParams = (props: {
  params?: string[];
  searchParams?: Record<string, string>;
  templateConfig: types.TemplateConfig;
  // When true, throws a "not found" error if any mapping item marked required:true
  // is absent from the URL. Set to false (or omit) for admin/preview pages.
  evaluateRequired?: boolean;
}): types.URLQueryCacheData => {
  const {
    params,
    searchParams,
    templateConfig,
    evaluateRequired = false,
  } = props;

  if (evaluateRequired) {
    // Check pathMapping: if a segment has any required item but the path segment is absent, 404
    for (let i = 0; i < templateConfig.pathMapping.length; i++) {
      const segment = templateConfig.pathMapping[i];
      const hasRequired = segment.some((item) => item.required === true);
      if (hasRequired && (!params || i >= params.length || !params[i])) {
        throw new Error("not found: required path segment missing");
      }
    }

    // Check queryMapping: if a param has any required item but the query key is absent, 404
    for (const [paramName, items] of Object.entries(
      templateConfig.queryMapping
    )) {
      const hasRequired = items.some((item) => item.required === true);
      if (hasRequired && (!searchParams || !(paramName in searchParams))) {
        throw new Error("not found: required query parameter missing");
      }
    }
  }

  const pathResult = !params
    ? {}
    : parseParams(params, templateConfig.pathMapping);
  const queryResult = !searchParams
    ? {}
    : parseSearchParams(searchParams, templateConfig.queryMapping);

  // Deep merge with path taking precedence over query
  const result: types.URLQueryCacheData = { ...queryResult };

  for (const [nodeName, queries] of Object.entries(pathResult)) {
    if (!result[nodeName]) {
      result[nodeName] = queries;
    } else {
      // Path values override query values
      result[nodeName] = { ...result[nodeName], ...queries };
    }
  }

  logger.log(
    "parseParamsAndSearchParams: pathResult =",
    pathResult,
    "queryResult =",
    queryResult,
    "finalResult =",
    result
  );

  return result;
};
