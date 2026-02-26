"use client";

import queryString from "querystring";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { useNavigation } from "@rnaga/wp-next-core/client/hooks/use-navigation";

import * as types from "../../types";
import { useWPAdmin } from "../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

type Options = {
  update: boolean;
};

export const useAdminNavigation = <Params = Record<string, any>>() => {
  const {
    pathname,
    searchParams,
    navigationStatus,
    router,
    queryObject,
    pushRouter,
    updateRouter,
    goto,
    createQueryObject,
    createQueryString,
  } = useNavigation<Params>();

  const typedRouter: AppRouterInstance = router;

  const {
    site: { basePath, blogBasePath },
    wp: { globalState },
  } = useWPAdmin();

  const layoutKeys = globalState.get("layout-keys");

  const refresh = (
    keys?: (keyof wpCoreTypes.client.GlobalState["layout-keys"])[]
  ) => {
    const defaults = { header: 1, sidebar: 2, main: 3, content: 4 };
    const generateKeyValue = (
      key: keyof wpCoreTypes.client.GlobalState["layout-keys"]
    ) => {
      return keys?.includes(key)
        ? Math.random()
        : layoutKeys?.[key] ?? defaults[key];
    };

    const newKeys = {
      header: generateKeyValue("header"),
      sidebar: generateKeyValue("sidebar"),
      main: generateKeyValue("main"),
      content: generateKeyValue("content"),
    };

    globalState.set("layout-keys", newKeys);
  };

  const refreshValue = () => globalState.get("layout-keys");

  const currentPath = pathname.replace(new RegExp(`^${blogBasePath}`), "");

  const resolvePath = (
    segment: types.client.AdminPageSegment,
    options?: Partial<{
      absolute: boolean;
      append: string;
      queryParams?: queryString.ParsedUrlQueryInput;
    }>
  ): string => {
    const { absolute = true, append = "", queryParams } = options ?? {};

    const prepend = absolute ? blogBasePath : currentPath;
    const query = queryParams ? `?${queryString.stringify(queryParams)}` : "";
    return `${prepend}/${String(segment)}${append ?? ""}${query}`;
  };

  const currentPageSegment = globalState.get("page-segment");

  const gotoPath = (
    path: string,
    options?: Partial<{
      segment: types.client.AdminPageSegment;
      queryParams?: queryString.ParsedUrlQueryInput;
    }>
  ) => {
    const segment = options?.segment ?? currentPageSegment;
    if (!segment) {
      throw new Error("Segment is not defined.");
    }
    goto(
      resolvePath(segment, {
        queryParams: options?.queryParams,
        append: path,
      })
    );
  };

  return {
    pathname,
    basePath,
    blogBasePath,
    searchParams,
    navigationStatus,
    router: typedRouter,
    currentPath,
    resolvePath,
    gotoPath,
    queryObject,
    createQueryObject,
    createQueryString,
    pushRouter,
    updateRouter,
    goto,
    refresh,
    refreshValue,
  };
};
