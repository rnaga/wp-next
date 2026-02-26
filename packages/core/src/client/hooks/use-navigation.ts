"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useNavigation = <Params = Record<string, any>>() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const navigationStatus = searchParams.toString();

  const createQueryObject = (
    params?: Params,
    options?: {
      update: boolean;
    }
  ) => {
    const newParams = new Map();
    const update = options?.update ?? true;

    if (update) {
      for (const [k, v] of searchParams.entries()) {
        newParams.set(k, v);
      }
    }

    for (const [k, v] of Object.entries(params ?? {})) {
      newParams.set(k, v);
    }

    return Object.fromEntries(newParams);
  };

  const queryObject = createQueryObject() as Params;

  const createQueryString = (
    params?: Params,
    options?: { update: boolean }
  ) => {
    return `?${new URLSearchParams(
      createQueryObject(params, options)
    ).toString()}`;
  };

  const updateRouter = (params?: Params) => {
    router.push(createQueryString(params), { scroll: false });
  };

  const pushRouter = (params?: Params) => {
    router.push(createQueryString(params, { update: false }), {
      scroll: false,
    });
  };

  const goto = (path: string) => {
    router.push(path);
  };

  return {
    pathname,
    searchParams,
    navigationStatus,
    router,
    queryObject,
    pushRouter,
    updateRouter,
    createQueryObject,
    createQueryString,
    goto,
  };
};
