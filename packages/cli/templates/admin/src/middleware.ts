import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(request) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(process.env.HEADER_X_URL ?? "x-url", request.url);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
