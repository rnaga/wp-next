import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { isValidPublicSlug } from "@rnaga/wp-next-editor/lexical/validate-slug";
import * as actionsTemplate from "@rnaga/wp-next-editor/server/actions/template";
import {
  X_ADMIN_PAGE_HEADER,
  X_NOT_FOUND_HEADER,
  X_URL_HEADER,
} from "@rnaga/wp-next-editor/server/constant";

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({ req: request });

    if (!token) {
      const signInUrl = new URL("/auth/login", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(X_URL_HEADER, request.url);
    requestHeaders.set(X_ADMIN_PAGE_HEADER, "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (request.nextUrl.pathname.startsWith("/auth")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(X_URL_HEADER, request.url);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Validate the first path segment as a public slug.
  // e.g. "/,asdasdf/..." => slug ",asdasdf" is invalid => 404
  const firstSegment = request.nextUrl.pathname
    .replace(/^\//, "")
    .split("/")[0];
  if (firstSegment && !isValidPublicSlug(firstSegment)) {
    const notFoundHeaders = new Headers(request.headers);
    notFoundHeaders.set(X_NOT_FOUND_HEADER, "1");
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
      request: { headers: notFoundHeaders },
    });
  }

  // Check that the slug is published.
  if (firstSegment) {
    const publishedSlugs = await actionsTemplate.getPublishedSlugs();
    if (!publishedSlugs.data?.includes(firstSegment)) {
      const notFoundHeaders = new Headers(request.headers);
      notFoundHeaders.set(X_NOT_FOUND_HEADER, "1");
      return NextResponse.rewrite(new URL("/not-found", request.url), {
        status: 404,
        request: { headers: notFoundHeaders },
      });
    }
  }

  // For all other routes, forward the full URL so server components
  // (e.g. the public layout) can read the pathname and search params.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(X_URL_HEADER, request.url);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Exclude _next internals, favicon.ico, API routes, and public static asset
  // directories (uploads/, files/) from middleware so Next.js can serve those
  // files directly without the published-slug gate triggering a 404.
  matcher: ["/admin", "/admin/:path*", "/((?!_next|favicon.ico|api|uploads|files).*)"],
};
